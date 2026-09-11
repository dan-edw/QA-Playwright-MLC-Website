const fs = require('fs');

const file = 'test-results.xml';

if (!fs.existsSync(file)) {
  console.error(`ERROR: ${file} does not exist`);
  process.exit(1);
}

let xml = fs.readFileSync(file, 'utf8');

const jiraKeys = [];

xml = xml.replace(
  /<testcase([^>]*)name="\[([A-Z]+-\d+)\]\s*([^"]*)"([^>]*)>/g,
  (match, beforeName, key, name, afterName) => {

    jiraKeys.push(key);

    return `<testcase${beforeName}name="${name}"${afterName}>
<properties>
  <property name="test_key" value="${key}"/>
</properties>`;
  }
);

if (jiraKeys.length === 0) {
  console.error(
    'ERROR: No Jira/Xray test keys were found in Playwright JUnit'
  );
  process.exit(1);
}

const duplicates = [
  ...new Set(
    jiraKeys.filter(
      (key, index) => jiraKeys.indexOf(key) !== index
    )
  )
];

if (duplicates.length > 0) {
  console.error(
    `ERROR: Duplicate Jira/Xray keys detected: ${duplicates.join(', ')}`
  );
  process.exit(1);
}

fs.writeFileSync(file, xml);

console.log('');
console.log(`Mapped Xray testcases: ${jiraKeys.length}`);
console.log(`Xray test keys: ${jiraKeys.sort().join(', ')}`);
console.log('');
console.log('JUnit XML updated for Xray');
