#! /usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const [, , packageDir, version] = process.argv;

if (!packageDir || !version) {
  console.error('Usage: set-package-version.js <package-dir> <version>');
  process.exit(1);
}

const packageJsonPath = path.resolve(packageDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.version = version;
fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
