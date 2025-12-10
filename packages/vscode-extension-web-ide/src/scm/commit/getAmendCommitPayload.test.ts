import { type DefaultGitLabClient, type gitlab, gitlabApi } from '@khulnasoft/khulnasoft-api-client';
import { FileStatusType } from '@khulnasoft/web-ide-fs';
import type { FileStatus } from '@khulnasoft/web-ide-fs';
import { isEqual } from 'lodash';
import { createFakePartial } from '@khulnasoft/utils-test';
import { getAmendCommitPayload } from './getAmendCommitPayload';
import { getCommitPayload } from './getCommitPayload';

const TEST_PROJECT_ID = '123';
const TEST_COMMIT_SHA = 'abc123';
const TEST_PARENT_SHA = 'parent456';
const TEST_COMMIT_MESSAGE = 'Original commit message';
const TEST_CONTENT = 'file content';
const TEST_BRANCH_NAME = 'ps-foo-branch';
const TEST_IS_NEW_BRANCH = false;
const TEST_RAW_BUFFER = Buffer.from(TEST_CONTENT);

describe('scm/commit/getAmendCommitPayload', () => {
  const TEST_ORIGINAL_COMMIT: gitlab.CommitDetails = {
    id: TEST_COMMIT_SHA,
    parent_ids: [TEST_PARENT_SHA],
    message: TEST_COMMIT_MESSAGE,
  } as gitlab.CommitDetails;

  const TEST_ORIGINAL_DIFF = [
    { new_file: true, new_path: 'new-file.js', old_path: 'new-file.js' },
    { new_file: false, new_path: 'modified-file.js', old_path: 'modified-file.js' },
    { deleted_file: true, new_path: 'deleted-file.js', old_path: 'deleted-file.js' },
  ];
  const TEST_ORIGINAL_STATUS: FileStatus[] = [
    { path: 'new-file.js', type: FileStatusType.Created, content: TEST_RAW_BUFFER },
    { path: 'modified-file.js', type: FileStatusType.Modified, content: TEST_RAW_BUFFER },
    { path: 'deleted-file.js', type: FileStatusType.Deleted },
  ];

  let apiClient: DefaultGitLabClient;

  beforeEach(() => {
    jest.clearAllMocks();

    apiClient = createFakePartial<DefaultGitLabClient>({
      fetchFromApi: jest.fn().mockImplementation(async request => {
        if (
          isEqual(
            request,
            gitlabApi.getCommit.createRequest({ projectId: TEST_PROJECT_ID, sha: TEST_COMMIT_SHA }),
          )
        ) {
          return TEST_ORIGINAL_COMMIT;
        }
        if (
          isEqual(
            request,
            gitlabApi.getCommitDiff.createRequest({
              projectId: TEST_PROJECT_ID,
              sha: TEST_COMMIT_SHA,
            }),
          )
        ) {
          return TEST_ORIGINAL_DIFF;
        }
        return undefined;
      }),

      fetchBufferFromApi: jest.fn().mockResolvedValue(TEST_RAW_BUFFER),
    });
  });

  describe('when amending with valid changes', () => {
    it('makes correct API call to fetch commit', async () => {
      await getAmendCommitPayload(apiClient, {
        projectId: TEST_PROJECT_ID,
        startingSha: TEST_COMMIT_SHA,
        status: [],
        commitMessage: 'new commit message',
        branchName: TEST_BRANCH_NAME,
        isNewBranch: TEST_IS_NEW_BRANCH,
      });

      expect(apiClient.fetchFromApi).toHaveBeenNthCalledWith(
        1,
        gitlabApi.getCommit.createRequest({
          projectId: TEST_PROJECT_ID,
          sha: TEST_COMMIT_SHA,
        }),
      );
    });

    it('makes correct API call to fetch diff', async () => {
      await getAmendCommitPayload(apiClient, {
        projectId: TEST_PROJECT_ID,
        startingSha: TEST_COMMIT_SHA,
        status: [],
        commitMessage: 'new commit message',
        branchName: TEST_BRANCH_NAME,
        isNewBranch: TEST_IS_NEW_BRANCH,
      });

      expect(apiClient.fetchFromApi).toHaveBeenNthCalledWith(
        2,
        gitlabApi.getCommitDiff.createRequest({
          projectId: TEST_PROJECT_ID,
          sha: TEST_COMMIT_SHA,
        }),
      );
    });

    describe('returns correct payload', () => {
      it('when adding a new file', async () => {
        const newStatus: FileStatus[] = [
          { path: 'new-1-file.js', type: FileStatusType.Created, content: TEST_RAW_BUFFER },
        ];

        const payload = await getAmendCommitPayload(apiClient, {
          projectId: TEST_PROJECT_ID,
          startingSha: TEST_COMMIT_SHA,
          status: newStatus,
          commitMessage: TEST_COMMIT_MESSAGE,
          branchName: TEST_BRANCH_NAME,
          isNewBranch: TEST_IS_NEW_BRANCH,
        });

        const expectedPayload = getCommitPayload({
          status: [
            ...TEST_ORIGINAL_STATUS,
            { path: 'new-1-file.js', type: FileStatusType.Created, content: TEST_RAW_BUFFER },
          ],
          commitMessage: TEST_COMMIT_MESSAGE,
          branchName: TEST_BRANCH_NAME,
          isNewBranch: TEST_IS_NEW_BRANCH,
          startingSha: TEST_PARENT_SHA,
          force: true,
        });
        expect(payload).toEqual(expectedPayload);
      });

      it('when modifing a new file in original commit', async () => {
        const newContent = Buffer.from('new content');
        const newStatus: FileStatus[] = [
          { path: 'new-file.js', type: FileStatusType.Modified, content: newContent },
        ];

        const payload = await getAmendCommitPayload(apiClient, {
          projectId: TEST_PROJECT_ID,
          startingSha: TEST_COMMIT_SHA,
          status: newStatus,
          commitMessage: TEST_COMMIT_MESSAGE,
          branchName: TEST_BRANCH_NAME,
          isNewBranch: TEST_IS_NEW_BRANCH,
        });
        const expectedPayload = getCommitPayload({
          status: [
            { path: 'new-file.js', type: FileStatusType.Created, content: newContent },
            { path: 'modified-file.js', type: FileStatusType.Modified, content: TEST_RAW_BUFFER },
            { path: 'deleted-file.js', type: FileStatusType.Deleted },
          ],
          commitMessage: TEST_COMMIT_MESSAGE,
          branchName: TEST_BRANCH_NAME,
          isNewBranch: TEST_IS_NEW_BRANCH,
          startingSha: TEST_PARENT_SHA,
          force: true,
        });

        expect(payload).toEqual(expectedPayload);
      });

      it('when deleting new file new in original commit', async () => {
        const newStatus: FileStatus[] = [{ path: 'new-file.js', type: FileStatusType.Deleted }];

        const payload = await getAmendCommitPayload(apiClient, {
          projectId: TEST_PROJECT_ID,
          startingSha: TEST_COMMIT_SHA,
          status: newStatus,
          commitMessage: TEST_COMMIT_MESSAGE,
          branchName: TEST_BRANCH_NAME,
          isNewBranch: TEST_IS_NEW_BRANCH,
        });

        const expectedPayload = getCommitPayload({
          status: [
            { path: 'modified-file.js', type: FileStatusType.Modified, content: TEST_RAW_BUFFER },
            { path: 'deleted-file.js', type: FileStatusType.Deleted },
          ],
          commitMessage: TEST_COMMIT_MESSAGE,
          branchName: TEST_BRANCH_NAME,
          isNewBranch: TEST_IS_NEW_BRANCH,
          startingSha: TEST_PARENT_SHA,
          force: true,
        });
        expect(payload).toEqual(expectedPayload);
      });
      it('when deleting file not in original commit', async () => {
        const newStatus: FileStatus[] = [
          { path: 'not-in-original.js', type: FileStatusType.Deleted },
        ];

        const payload = await getAmendCommitPayload(apiClient, {
          projectId: TEST_PROJECT_ID,
          startingSha: TEST_COMMIT_SHA,
          status: newStatus,
          commitMessage: TEST_COMMIT_MESSAGE,
          branchName: TEST_BRANCH_NAME,
          isNewBranch: TEST_IS_NEW_BRANCH,
        });
        const expectedPayload = getCommitPayload({
          status: [
            { path: 'new-file.js', type: FileStatusType.Created, content: TEST_RAW_BUFFER },
            { path: 'modified-file.js', type: FileStatusType.Modified, content: TEST_RAW_BUFFER },
            { path: 'deleted-file.js', type: FileStatusType.Deleted },
            { path: 'not-in-original.js', type: FileStatusType.Deleted },
          ],
          commitMessage: TEST_COMMIT_MESSAGE,
          branchName: TEST_BRANCH_NAME,
          isNewBranch: TEST_IS_NEW_BRANCH,
          startingSha: TEST_PARENT_SHA,
          force: true,
        });
        expect(payload).toEqual(expectedPayload);
      });

      it('when modifying file not in original commit', async () => {
        const newContent = Buffer.from('modified content');
        const newStatus: FileStatus[] = [
          { path: 'not-in-original.js', type: FileStatusType.Modified, content: newContent },
        ];

        const payload = await getAmendCommitPayload(apiClient, {
          projectId: TEST_PROJECT_ID,
          startingSha: TEST_COMMIT_SHA,
          status: newStatus,
          commitMessage: TEST_COMMIT_MESSAGE,
          branchName: TEST_BRANCH_NAME,
          isNewBranch: TEST_IS_NEW_BRANCH,
        });

        const expectedPayload = getCommitPayload({
          status: [
            { path: 'new-file.js', type: FileStatusType.Created, content: TEST_RAW_BUFFER },
            { path: 'modified-file.js', type: FileStatusType.Modified, content: TEST_RAW_BUFFER },
            { path: 'deleted-file.js', type: FileStatusType.Deleted },
            { path: 'not-in-original.js', type: FileStatusType.Modified, content: newContent },
          ],
          commitMessage: TEST_COMMIT_MESSAGE,
          branchName: TEST_BRANCH_NAME,
          isNewBranch: TEST_IS_NEW_BRANCH,
          startingSha: TEST_PARENT_SHA,
          force: true,
        });

        expect(payload).toEqual(expectedPayload);
      });
    });
  });
});
