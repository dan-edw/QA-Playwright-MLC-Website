const fs = require('fs');

const INPUT = 'playwright-results.json';
const OUTPUT = 'xray-results.xml';

// ---------------------------------------------------------
// Validate input
// ---------------------------------------------------------

if (!fs.existsSync(INPUT)) {
  console.error(`ERROR: ${INPUT} does not exist`);
  process.exit(1);
}

let report;

try {
  report = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
} catch (error) {
  console.error(`ERROR: Unable to parse ${INPUT}`);
  console.error(error.message);
  process.exit(1);
}

// ---------------------------------------------------------
// Configuration
// ---------------------------------------------------------

// Example:
// [CUTECH-2826] Verify Complaint Page Loads
const jiraPattern = /\[([A-Z][A-Z0-9]+-\d+)\]\s*(.*)/;

// Map structure:
//
// CUTECH-2826
//   ├── chromium
//   ├── firefox
//   ├── webkit
//   └── Microsoft Edge
//
const logicalTests = new Map();

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isPassed(result) {
  return result.status === 'passed';
}

// ---------------------------------------------------------
// Walk Playwright JSON
// ---------------------------------------------------------

function walkSuite(suite) {
  for (const spec of suite.specs || []) {
    const match = spec.title.match(jiraPattern);

    // Ignore Playwright tests that do not contain a Jira/Xray key
    if (!match) {
      continue;
    }

    const jiraKey = match[1];
    const testName = match[2].trim();

    if (!logicalTests.has(jiraKey)) {
      logicalTests.set(jiraKey, {
        jiraKey,
        testName,
        browserResults: new Map()
      });
    }

    const logicalTest = logicalTests.get(jiraKey);

    // Safety check:
    // The same Jira key should not represent different logical tests.
    if (logicalTest.testName !== testName) {
      console.error(
        `ERROR: Jira key ${jiraKey} is used by multiple test names:`
      );
      console.error(`  "${logicalTest.testName}"`);
      console.error(`  "${testName}"`);
      process.exit(1);
    }

    for (const test of spec.tests || []) {
      const browser =
        test.projectName ||
        test.projectId ||
        'unknown';

      const attempts = test.results || [];

      if (attempts.length === 0) {
        logicalTest.browserResults.set(browser, {
          browser,
          status: 'unknown',
          duration: 0,
          retry: 0,
          attempts: 0,
          errors: []
        });

        continue;
      }

      // Playwright results are ordered by attempt.
      // The last attempt represents the final outcome.
      const finalAttempt = attempts[attempts.length - 1];

      const totalDuration = attempts.reduce(
        (sum, attempt) => sum + (attempt.duration || 0),
        0
      );

      logicalTest.browserResults.set(browser, {
        browser,
        status: finalAttempt.status || 'unknown',
        duration: totalDuration,
        retry: finalAttempt.retry || 0,
        attempts: attempts.length,
        errors: finalAttempt.errors || []
      });
    }
  }

  // Recursively process nested describe() blocks
  for (const child of suite.suites || []) {
    walkSuite(child);
  }
}

// ---------------------------------------------------------
// Extract tests
// ---------------------------------------------------------

for (const suite of report.suites || []) {
  walkSuite(suite);
}

const tests = Array.from(logicalTests.values()).map(test => ({
  ...test,
  browserResults: Array.from(test.browserResults.values())
}));

if (tests.length === 0) {
  console.error(
    'ERROR: No Jira/Xray test keys were found in Playwright JSON'
  );
  process.exit(1);
}

// ---------------------------------------------------------
// Validate browser results
// ---------------------------------------------------------

const expectedBrowsers = (report.config?.projects || [])
  .map(project => project.name)
  .filter(Boolean);

console.log('');
console.log('Expected browser projects:');

for (const browser of expectedBrowsers) {
  console.log(`  - ${browser}`);
}

console.log('');

for (const test of tests) {
  if (test.browserResults.length === 0) {
    console.error(
      `ERROR: ${test.jiraKey} contains no browser executions`
    );
    process.exit(1);
  }

  // Verify every configured Playwright project produced a result.
  for (const browser of expectedBrowsers) {
    const found = test.browserResults.some(
      result => result.browser === browser
    );

    if (!found) {
      console.error(
        `ERROR: ${test.jiraKey} is missing a result for browser '${browser}'`
      );
      process.exit(1);
    }
  }
}

// ---------------------------------------------------------
// Browser summary
// ---------------------------------------------------------

function buildBrowserSummary(browserResults) {
  return browserResults
    .map(result => {
      const durationSeconds =
        (result.duration / 1000).toFixed(2);

      let retryText = '';

      if (result.retry > 0) {
        retryText = `, retry ${result.retry}`;
      }

      return (
        `${result.browser}: ` +
        `${result.status.toUpperCase()} ` +
        `(${durationSeconds}s${retryText})`
      );
    })
    .join('\n');
}

// ---------------------------------------------------------
// Failure details
// ---------------------------------------------------------

function buildFailureDetails(browserResults) {
  return browserResults
    .filter(result => !isPassed(result))
    .map(result => {
      const errors = result.errors
        .map(error => {
          if (error.message) {
            return error.message;
          }

          if (error.value) {
            return error.value;
          }

          return String(error);
        })
        .join('\n');

      return [
        `Browser: ${result.browser}`,
        `Status: ${result.status.toUpperCase()}`,
        `Retry: ${result.retry}`,
        '',
        errors || 'No Playwright error message was provided.'
      ].join('\n');
    })
    .join('\n\n');
}

// ---------------------------------------------------------
// Generate Xray JUnit
// ---------------------------------------------------------

let passed = 0;
let failed = 0;

const testcaseXml = tests
  .map(test => {
    // One logical Xray test passes only when every browser passes.
    const overallPassed =
      test.browserResults.length > 0 &&
      test.browserResults.every(isPassed);

    if (overallPassed) {
      passed++;
    } else {
      failed++;
    }

    const totalDuration =
      test.browserResults.reduce(
        (sum, result) => sum + result.duration,
        0
      ) / 1000;

    const browserSummary =
      buildBrowserSummary(test.browserResults);

    let xml = `
    <testcase
      name="${escapeXml(test.testName)}"
      classname="Playwright"
      time="${totalDuration.toFixed(3)}">
      <properties>
        <property
          name="test_key"
          value="${escapeXml(test.jiraKey)}"/>
      </properties>
      <system-out>${escapeXml(browserSummary)}</system-out>`;

    if (!overallPassed) {
      const failureDetails =
        buildFailureDetails(test.browserResults);

      xml += `
      <failure message="One or more browser executions failed">${escapeXml(
        failureDetails
      )}</failure>`;
    }

    xml += `
    </testcase>`;

    return xml;
  })
  .join('\n');

// ---------------------------------------------------------
// Final XML
// ---------------------------------------------------------

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites
  tests="${tests.length}"
  failures="${failed}">
  <testsuite
    name="Playwright Cross-Browser Regression"
    tests="${tests.length}"
    failures="${failed}">
${testcaseXml}
  </testsuite>
</testsuites>
`;

fs.writeFileSync(OUTPUT, xml);

// ---------------------------------------------------------
// Console summary
// ---------------------------------------------------------

console.log('========================================');
console.log('Xray JUnit generated successfully');
console.log('========================================');
console.log('');
console.log(`Logical Xray tests : ${tests.length}`);
console.log(`Passed             : ${passed}`);
console.log(`Failed             : ${failed}`);
console.log(`Output             : ${OUTPUT}`);
console.log('');

for (const test of tests) {
  const overallPassed =
    test.browserResults.length > 0 &&
    test.browserResults.every(isPassed);

  console.log(
    `${test.jiraKey} - ${test.testName} - ${
      overallPassed ? 'PASS' : 'FAIL'
    }`
  );

  for (const result of test.browserResults) {
    const duration =
      (result.duration / 1000).toFixed(2);

    console.log(
      `  ${result.browser}: ` +
      `${result.status.toUpperCase()} ` +
      `(${duration}s)`
    );
  }

  console.log('');
}