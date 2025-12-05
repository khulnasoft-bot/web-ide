const fs = require('node:fs/promises');
const path = require('node:path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const TEMP_DIR = path.join(ROOT_DIR, 'tmp', 'web-ide-package-test');
const FIXTURE_DIR = path.join(
  ROOT_DIR,
  'tests',
  'package-test',
  'fixtures',
  'web-ide-package-test',
);

async function setup() {
  // 1. Setup test arguments -----------------------------------------------
  const webIdePackageArg = process.argv[2];

  if (!webIdePackageArg) {
    throw new Error('WEB_IDE_PACKAGE_PATH is required. Please provide it as the first argument.');
  }

  // - Let's resolve to the full path so we can reference this path safely
  const webIdePackagePath = path.resolve(webIdePackageArg);
  try {
    await fs.access(webIdePackagePath, fs.constants.R_OK);
  } catch (err) {
    throw new Error(`File could not be read: ${webIdePackagePath}`);
  }

  // 2. Setup temp directory for testing the package -----------------------
  console.log(`Setting up test directory (${TEMP_DIR})...`);
  await fs.rm(TEMP_DIR, { recursive: true, force: true });
  await fs.cp(FIXTURE_DIR, TEMP_DIR, { recursive: true });

  const packageJsonPath = path.join(TEMP_DIR, 'package.json');
  const origPackageJson = await fs.readFile(packageJsonPath, 'utf8');
  const packageJson = origPackageJson.replace('{{WEB_IDE_PACKAGE_PATH}}', webIdePackagePath);
  await fs.writeFile(packageJsonPath, packageJson, 'utf8');

  // 3. Install package using yarn ------------------------------------------
  console.log('Installing package using yarn...');
  process.chdir(TEMP_DIR);
  execSync('yarn install --silent', { stdio: 'inherit' });
}

module.exports = {
  setup,
  TEMP_DIR,
};
