const fs = require('fs');

const file = 'test-results.xml';

if (!fs.existsSync(file)) {
  console.error(`ERROR: ${file} does not exist`);
  process.exit(1);
}

let xml = fs.readFileSync(file, 'utf8');

let mappedCount = 0;

xml = xml.replace(
  /<testcase([^>]*)name="([^"]*?)\[([A-Z][A-Z0-9]*-\d+)\]\s*([^"]*)"([^>]*)>/g,
  (match, beforeName, prefix, key, testName, afterName) => {
    mappedCount++;

    return `<testcase${beforeName}name="${testName.trim()}"${afterName}>
<properties>
  <property name="test_key" value="${key}"/>
</properties>`;
  }
);

if (mappedCount === 0) {
  console.error(
    'ERROR: No Jira/Xray test keys were found in Playwright JUnit'
  );
  process.exit(1);
}

fs.writeFileSync(file, xml);

console.log(`JUnit XML updated for Xray`);
console.log(`Mapped Playwright executions: ${mappedCount}`);
