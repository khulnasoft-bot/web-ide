/* eslint-disable no-console */
/**
 * Script used to validate commit messages
 *
 * ## How do I run this file locally?
 *
 * ```
 * CI_COMMIT_SHA=HEAD CI_MERGE_REQUEST_TARGET_BRANCH_NAME=main node ./scripts/lint-commit.js
 * ```
 */
import read from '@commitlint/read';
import lint from '@commitlint/lint';
import format from '@commitlint/format';
import config from '@commitlint/config-conventional';

const MAXIMUM_LINE_LENGTH = 72;

// why: Use a large number like 200 since it's nice to have URL's in the body
const MAXIMUM_BODY_LENGTH = 200;

// You can test the script by setting these environment variables
const {
  CI_COMMIT_SHA,
  CI_MERGE_REQUEST_TARGET_BRANCH_NAME, // usually main
} = process.env;

const HELP_URL =
  'https://gitlab.com/khulnasoft/web-ide/-/blob/main/docs/dev/style_guide.md#conventional-commits';

const customRules = {
  'header-max-length': [2, 'always', MAXIMUM_LINE_LENGTH],
  'body-max-line-length': [2, 'always', MAXIMUM_BODY_LENGTH],
  'footer-max-line-length': [0, 'always'],
  'body-leading-blank': [2, 'always'],
  'footer-leading-blank': [2, 'always'],
  'subject-case': [0],
};

async function getCommitsInMr() {
  const targetBranch = `origin/${CI_MERGE_REQUEST_TARGET_BRANCH_NAME}`;
  const sourceCommit = CI_COMMIT_SHA;
  const messages = await read({ from: targetBranch, to: sourceCommit });
  return messages;
}

async function isConventional(message) {
  return lint(message, { ...config.rules, ...customRules }, { defaultIgnores: true });
}

async function lintMr() {
  const commits = await getCommitsInMr();

  console.log(
    "INFO: Every commit must adhere to conventional commits. Consider using `git commit --fixup` for commits you'd like to squash and ignore.",
  );

  return Promise.all(commits.map(isConventional));
}

async function run() {
  const results = await lintMr();

  console.error(format({ results }, { helpUrl: HELP_URL }));

  const numOfErrors = results.reduce((acc, result) => acc + result.errors.length, 0);
  if (numOfErrors !== 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
