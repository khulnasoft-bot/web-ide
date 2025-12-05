#! /usr/bin/env node
const { tap } = require('node:test/reporters');
const { run } = require('node:test');
const path = require('node:path');
const { setup } = require('./setup');

async function main() {
  await setup();

  run({ files: [path.resolve(__dirname, 'test.js')] })
    .on('test:fail', () => {
      process.exitCode = 1;
    })
    .compose(tap)
    .pipe(process.stdout);
}

main();
