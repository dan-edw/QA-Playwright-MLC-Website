const fs = require('fs');

const junitFile = 'test-results.xml';
const jsonFile = 'playwright-results.json';

if (!fs.existsSync(junitFile)) {
  console.error(`ERROR: ${junitFile} does not exist`);
  process.exit(1);
}

if (!fs.existsSync(jsonFile)) {
  console.error(`ERROR: ${jsonFile} does not exist`);
  process.exit(1);
}

let xml = fs.readFileSync(junitFile, 'utf8');
const report = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

const environment = (process.env.ENVIRONMENT || 'UNKNOWN').toUpperCase();

const executions = [];

/*
* Recursively walk the Playwright JSON suites.
*
* Each Playwright spec contains:
*   title
*   file
*   tests[]
*
* Each test contains:
*   projectName
*   results[]
*/
function walkSuites(suites = []) {
  for (const suite of suites) {

    for (const spec of suite.specs || []) {
      const jiraMatch = spec.title.match(
        /\[([A-Z][A-Z0-9]*-\d+)\]/
      );

      if (!jiraMatch) {
        continue;
      }

      const jiraKey = jiraMatch[1];

      const testName = spec.title
        .replace(/\[[A-Z][A-Z0-9]*-\d+\]\s*/, '')
        .trim();

      for (const test of spec.tests || []) {

        const results = test.results || [];

        /*
         * Use the final result because CI retries are enabled.
         */
        const finalResult =
          results.length > 0
            ? results[results.length - 1]
            : null;

        executions.push({
          jiraKey,
          testName,
          projectName: test.projectName || 'Unknown',
          status: finalResult?.status || 'unknown',
          file: spec.file || suite.file || 'unknown'
        });
      }
    }

    walkSuites(suite.suites || []);
  }
}

walkSuites(report.suites || []);

if (executions.length === 0) {
  console.error(
    'ERROR: No Jira/Xray test executions were found in Playwright JSON'
  );
  process.exit(1);
}

console.log(
  `Playwright JSON executions found: ${executions.length}`
);

/*
* Make browser names nicer for Xray.
*/
function formatBrowserName(projectName) {
  switch (projectName.toLowerCase()) {
    case 'chromium':
      return 'Chromium';

    case 'firefox':
      return 'Firefox';

    case 'webkit':
      return 'WebKit';

    case 'microsoft edge':
      return 'Microsoft Edge';

    default:
      return projectName;
  }
}

function normaliseStatus(status) {
  switch ((status || '').toLowerCase()) {
    case 'passed':
      return 'PASS';

    case 'failed':
    case 'timedout':
    case 'interrupted':
      return 'FAIL';

    case 'skipped':
      return 'SKIPPED';

    default:
      return status.toUpperCase();
  }
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/*
* Track which JSON execution has already been used.
*
* The JUnit ordering currently corresponds with the JSON execution
* ordering for each Jira key, so each matching execution is consumed
* exactly once.
*/
const remainingExecutions = [...executions];

let mappedCount = 0;

xml = xml.replace(
  /<testcase([^>]*)name="([^"]*?)\[([A-Z][A-Z0-9]*-\d+)\]\s*([^"]*)"([^>]*)>/g,
  (match, beforeName, prefix, key, junitTestName, afterName) => {

    const executionIndex = remainingExecutions.findIndex(
      execution => execution.jiraKey === key
    );

    if (executionIndex === -1) {
      console.error(
        `ERROR: Could not find Playwright JSON execution for ${key}`
      );
      process.exit(1);
    }

    const execution = remainingExecutions[executionIndex];

    remainingExecutions.splice(executionIndex, 1);

    const browser = formatBrowserName(
      execution.projectName
    );

    const status = normaliseStatus(
      execution.status
    );

    const specName = execution.file
      .replace(/\\/g, '/')
      .split('/')
      .pop();

    const comment = [
      `Browser: ${browser}`,
      `Environment: ${environment}`,
      `Spec: ${specName}`,
      `Test: ${execution.testName}`,
      `Status: ${status}`
    ].join('\n');

    mappedCount++;

    console.log(
      `Mapped ${key} -> ${browser} -> ${status}`
    );

    return `<testcase${beforeName}name="${escapeXml(
      execution.testName
    )}"${afterName}>
<properties>
  <property name="test_key" value="${escapeXml(key)}"/>
  <property name="comment" value="${escapeXml(comment)}"/>
  <property name="browser" value="${escapeXml(browser)}"/>
  <property name="environment" value="${escapeXml(environment)}"/>
</properties>`;
  }
);

if (mappedCount === 0) {
  console.error(
    'ERROR: No Jira/Xray test keys were mapped into Playwright JUnit'
  );
  process.exit(1);
}

if (remainingExecutions.length !== 0) {
  console.error(
    `ERROR: ${remainingExecutions.length} Playwright JSON executions were not mapped`
  );

  for (const execution of remainingExecutions) {
    console.error(
      `Unmapped: ${execution.jiraKey} / ${execution.projectName}`
    );
  }

  process.exit(1);
}

fs.writeFileSync(junitFile, xml);

console.log('');
console.log('JUnit XML updated for Xray');
console.log(`Mapped Playwright executions: ${mappedCount}`);
