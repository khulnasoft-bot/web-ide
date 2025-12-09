import { cleanLeadingSeparator } from '@khulnasoft/utils-path';
import type { FileStatus } from '@khulnasoft/web-ide-fs';
import { FileStatusType } from '@khulnasoft/web-ide-fs';
import { getCommitPayload } from './getCommitPayload';

const TEST_COMMIT_ID = '000000111111';
const TEST_BRANCH_NAME = 'ps-foo-branch';
const TEST_COMMIT_MESSAGE = 'Hello world! I am commit\n\nChangelog: removed';

const TEST_CONTENT_1 = 'Lorem ipsum dolar sit!';
const TEST_CONTENT_2 = 'console.log("Hello world!");';
const TEST_STATUS: FileStatus[] = [
  {
    type: FileStatusType.Created,
    path: '/src/foo/new_file.md',
    content: Buffer.from(TEST_CONTENT_1),
  },
  {
    type: FileStatusType.Modified,
    path: '/src/foo/existingFile.js',
    content: Buffer.from(TEST_CONTENT_2),
  },
  {
    type: FileStatusType.Deleted,
    path: '/src/foo/DeadFile.java',
  },
];

describe('scm/commit/getCommitPayload', () => {
  it('creates payload', () => {
    const actual = getCommitPayload({
      status: TEST_STATUS,
      commitMessage: TEST_COMMIT_MESSAGE,
      branchName: TEST_BRANCH_NAME,
      isNewBranch: false,
      startingSha: TEST_COMMIT_ID,
    });

    expect(actual).toEqual({
      commit_message: TEST_COMMIT_MESSAGE,
      branch: TEST_BRANCH_NAME,
      actions: [
        {
          action: 'create',
          file_path: cleanLeadingSeparator(TEST_STATUS[0].path),
          content: Buffer.from(TEST_CONTENT_1).toString('base64'),
          encoding: 'base64',
          last_commit_id: TEST_COMMIT_ID,
        },
        {
          action: 'update',
          file_path: cleanLeadingSeparator(TEST_STATUS[1].path),
          content: Buffer.from(TEST_CONTENT_2).toString('base64'),
          encoding: 'base64',
          last_commit_id: TEST_COMMIT_ID,
        },
        {
          action: 'delete',
          file_path: cleanLeadingSeparator(TEST_STATUS[2].path),
          last_commit_id: undefined,
        },
      ],
    });
  });

  it('with isNewBranch: true, creates payload', () => {
    const actual = getCommitPayload({
      status: TEST_STATUS,
      commitMessage: TEST_COMMIT_MESSAGE,
      branchName: TEST_BRANCH_NAME,
      isNewBranch: true,
      startingSha: TEST_COMMIT_ID,
    });

    expect(actual).toMatchObject({
      start_sha: TEST_COMMIT_ID,
      actions: [
        {
          action: 'create',
          last_commit_id: undefined,
        },
        {
          action: 'update',
          last_commit_id: undefined,
        },
        {
          action: 'delete',
          last_commit_id: undefined,
        },
      ],
    });
  });

  it('with force: true, creates payload', () => {
    const actual = getCommitPayload({
      status: TEST_STATUS,
      commitMessage: TEST_COMMIT_MESSAGE,
      branchName: TEST_BRANCH_NAME,
      isNewBranch: false,
      startingSha: TEST_COMMIT_ID,
      force: true,
    });

    expect(actual).toMatchObject({
      start_sha: TEST_COMMIT_ID,
      force: true,
      actions: [
        {
          action: 'create',
          last_commit_id: undefined,
        },
        {
          action: 'update',
          last_commit_id: undefined,
        },
        {
          action: 'delete',
          last_commit_id: undefined,
        },
      ],
    });
  });
});
