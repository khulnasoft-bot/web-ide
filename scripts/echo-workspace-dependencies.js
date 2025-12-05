const { cwd } = require('process');
const { resolve } = require('path');

const DEPENDENCY_KEYS = ['dependencies', 'devDependencies'];
const path = process.argv[2] || '';

if (!path.endsWith('package.json')) {
  console.error('Expected argument to be path to package.json');
  process.exit(1);
}

const fullPath = resolve(cwd(), path);
// eslint-disable-next-line import/no-dynamic-require
const json = require(fullPath);

const result = DEPENDENCY_KEYS.flatMap(x => Object.entries(json[x] || {}))
  .filter(([, value]) => value.startsWith('workspace:'))
  .map(([key]) => key);

console.log(result.join(' '));
