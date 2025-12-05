import type { DefaultGitLabClient } from '@gitlab/gitlab-api-client';
import { gitlabApi } from '@gitlab/gitlab-api-client';
import { createFakePartial } from '@gitlab/utils-test';
import type { GitLabRef } from '@gitlab/vscode-mediator-commands';
import { isEqual } from 'lodash';
import { getRemoteCommitDifference } from './getRemoteCommitDifference';
import { TEST_BRANCH, TEST_REF_BRANCH } from '../../../test-utils';

const TEST_PROJECT_ID = '123';
const TEST_REMOTE_SHA = 'def456';
const TEST_LOCAL_COMMIT_COUNT = 5;
const TEST_REMOTE_COMMIT_COUNT = 8;
const TEST_TAG_REF: GitLabRef = {
  type: 'tag',
  name: 'v1.0.0',
  sha: TEST_REF_BRANCH.sha,
};

describe('scm/commit/getRemoteCommitDifference', () => {
  let apiClient: DefaultGitLabClient;

  beforeEach(() => {
    jest.clearAllMocks();

    apiClient = createFakePartial<DefaultGitLabClient>({
      fetchFromApi: jest.fn().mockImplementation(async request => {
        if (
          isEqual(
            request,
            gitlabApi.getCommitSequence.createRequest({
              projectId: TEST_PROJECT_ID,
              sha: TEST_REF_BRANCH.sha,
            }),
          )
        ) {
          return { count: TEST_LOCAL_COMMIT_COUNT };
        }
        if (
          isEqual(
            request,
            gitlabApi.getProjectBranch.createRequest({
              projectId: TEST_PROJECT_ID,
              branchName: TEST_BRANCH.name,
            }),
          )
        ) {
          return { commit: { id: TEST_REMOTE_SHA } };
        }
        if (
          isEqual(
            request,
            gitlabApi.getCommitSequence.createRequest({
              projectId: TEST_PROJECT_ID,
              sha: TEST_REMOTE_SHA,
            }),
          )
        ) {
          return { count: TEST_REMOTE_COMMIT_COUNT };
        }
        return undefined;
      }),
    });
  });

  describe('with branch ref', () => {
    let result: number;
    beforeEach(async () => {
      result = await getRemoteCommitDifference(apiClient, TEST_PROJECT_ID, TEST_REF_BRANCH);
    });
    it('call getCommitSequence with local branch', async () => {
      expect(apiClient.fetchFromApi).toHaveBeenNthCalledWith(
        1,
        gitlabApi.getCommitSequence.createRequest({
          projectId: TEST_PROJECT_ID,
          sha: TEST_REF_BRANCH.sha,
        }),
      );
    });

    it('call getProjectBranch to get remote branch', async () => {
      expect(apiClient.fetchFromApi).toHaveBeenNthCalledWith(
        2,
        gitlabApi.getProjectBranch.createRequest({
          projectId: TEST_PROJECT_ID,
          branchName: TEST_BRANCH.name,
        }),
      );
    });

    it('call getCommitSequence with remote branch', async () => {
      expect(apiClient.fetchFromApi).toHaveBeenNthCalledWith(
        3,
        gitlabApi.getCommitSequence.createRequest({
          projectId: TEST_PROJECT_ID,
          sha: TEST_REMOTE_SHA,
        }),
      );
    });

    it('returns commit difference', async () => {
      expect(result).toBe(3);
    });
  });

  describe('with non-branch ref', () => {
    it('returns 0 for tag refs without making API calls', async () => {
      const result = await getRemoteCommitDifference(apiClient, TEST_PROJECT_ID, TEST_TAG_REF);

      expect(result).toBe(0);
      expect(apiClient.fetchFromApi).not.toHaveBeenCalled();
    });
  });

  describe('with empty sha', () => {
    it('returns 0 for branch refs with empty sha without making API calls', async () => {
      const branchRefWithEmptySha: GitLabRef = {
        type: 'branch',
        branch: TEST_BRANCH,
        sha: '',
      };

      const result = await getRemoteCommitDifference(
        apiClient,
        TEST_PROJECT_ID,
        branchRefWithEmptySha,
      );

      expect(result).toBe(0);
      expect(apiClient.fetchFromApi).not.toHaveBeenCalled();
    });
  });
});
