const fs = require('fs');

const INPUT = 'playwright-results.json';
const OUTPUT = 'xray-results.xml';

if (!fs.existsSync(INPUT)) {
  console.error(`ERROR: ${INPUT} does not exist`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(INPUT, 'utf8'));

const jiraPattern = /\[([A-Z][A-Z0-9]+-\d+)\]\s*(.*)/;
const logicalTests = [];

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function walkSuite(suite) {
  for (const spec of suite.specs || []) {
    const match = spec.title.match(jiraPattern);

    if (!match) {
      continue;
    }

    const jiraKey = match[1];
    const testName = match[2].trim();

    const browserResults = (spec.tests || []).map(test => {
      const attempts = test.results || [];
      const finalAttempt = attempts[attempts.length - 1];

      return {
        browser: test.projectName || test.projectId || 'unknown',
        status: finalAttempt?.status || 'unknown',
        duration: finalAttempt?.duration || 0,
        retry: finalAttempt?.retry || 0,
        errors: finalAttempt?.errors || []
      };
    });

    logicalTests.push({
      jiraKey,
      testName,
      browserResults
    });
  }

  for (const child of suite.suites || []) {
    walkSuite(child);
  }
}

for (const suite of report.suites || []) {
  walkSuite(suite);
}

if (logicalTests.length === 0) {
  console.error(
    'ERROR: No Jira/Xray test keys were found in Playwright JSON'
  );
  process.exit(1);
}

const duplicateKeys = logicalTests
  .map(test => test.jiraKey)
  .filter((key, index, array) => array.indexOf(key) !== index);

if (duplicateKeys.length > 0) {
  console.error(
    `ERROR: Duplicate logical Jira/Xray tests found: ${[...new Set(duplicateKeys)].join(', ')}`
  );
  process.exit(1);
}

function isPassed(result) {
  return result.status === 'passed';
}

function buildBrowserSummary(browserResults) {
  return browserResults
    .map(result => {
      const durationSeconds = (result.duration / 1000).toFixed(2);

      return `${result.browser}: ${result.status.toUpperCase()} (${durationSeconds}s)`;
    })
    .join('\n');
}

function buildFailureDetails(browserResults) {
  return browserResults
    .filter(result => !isPassed(result))
    .map(result => {
      const errors = result.errors
        .map(error => error.message || String(error))
        .join('\n');

      return `${result.browser}:\n${errors || `Status: ${result.status}`}`;
    })
    .join('\n\n');
}

let passed = 0;
let failed = 0;

const testcaseXml = logicalTests.map(test => {
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

  const browserSummary = buildBrowserSummary(
    test.browserResults
  );

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
    const failureDetails = buildFailureDetails(
      test.browserResults
    );

    xml += `
    <failure message="One or more browser executions failed">${escapeXml(
      failureDetails
    )}</failure>`;
  }

  xml += `
  </testcase>`;

  return xml;
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites
  tests="${logicalTests.length}"
  failures="${failed}">
  <testsuite
    name="Playwright Cross-Browser Regression"
    tests="${logicalTests.length}"
    failures="${failed}">
${testcaseXml}
  </testsuite>
</testsuites>
`;

fs.writeFileSync(OUTPUT, xml);

console.log('');
console.log('Xray JUnit generated successfully.');
console.log(`Logical Xray tests : ${logicalTests.length}`);
console.log(`Passed             : ${passed}`);
console.log(`Failed             : ${failed}`);
console.log(`Output             : ${OUTPUT}`);
console.log('');

for (const test of logicalTests) {
  console.log(`${test.jiraKey} - ${test.testName}`);

  for (const result of test.browserResults) {
    console.log(
      `  ${result.browser}: ${result.status.toUpperCase()}`
    );
  }
}
