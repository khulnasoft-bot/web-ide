const { createDefaultPreset } = require('ts-jest');
const VSCodeInfo = require('./packages/vscode-build/vscode_version.json');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: './jest.domenvironment.js',
  testMatch: ['**/packages/**/*.test.ts'],
  testPathIgnorePatterns: ['dist/', 'lib/', 'tmp/', 'khulnasoft-vscode-extension'],
  modulePathIgnorePatterns: ['dist/', 'khulnasoft-vscode-extension'],
  resetMocks: true,
  transformIgnorePatterns: ['node_modules/(?!(nanoid)/)'],
  transform: {
    '^.+\\.(js|ts)$': 'ts-jest',
  },
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: true,
  },
  ...createDefaultPreset({
    tsconfig: 'tsconfig.jest.json',
  }),
  globals: {
    VSCodeInfo,
  },
};
