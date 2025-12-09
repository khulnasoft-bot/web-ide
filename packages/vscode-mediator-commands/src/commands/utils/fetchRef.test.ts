import { DeprecatedGitLabClient, DefaultGitLabClient } from '@gitlab/gitlab-api-client';
import { fetchRef } from './fetchRef';
import { createTestBranch } from '../../../test-utils';

// note: This isn't great, but we only want to mock the clients (not the utils)
//       coming from this package. Maybe there's a better way to do this...
jest.mock('@gitlab/gitlab-api-client/src/DeprecatedGitLabClient');
jest.mock('@gitlab/gitlab-api-client/src/DefaultGitLabClient');

const TEST_PROJECT_PATH = 'lorem/ipsum';
const TEST_BRANCH_NAME = 'ps-test';
const TEST_COMMIT_REF = 'd9bb1c2';
const TEST_COMMIT_SHA = 'd9bb1c234b1e091cb84ba0a5c72e364c5ee2878e';
const TEST_TAG = 'v1.2';
const TEST_BRANCH = createTestBranch(TEST_PROJECT_PATH, TEST_BRANCH_NAME);

describe('commands/utils/fetchRef', () => {
  let client: DeprecatedGitLabClient;

  const mockFetchProjectBranch = (
    result: ReturnType<DeprecatedGitLabClient['fetchProjectBranch']>,
  ) => {
    jest.mocked(client).fetchProjectBranch.mockReturnValue(result);
  };

  const mockFetchRefMetadata = (sha?: string) => {
    jest.mocked(client).fetchRefMetadata.mockResolvedValue({
      tree: {
        lastCommit: !sha
          ? null
          : {
              sha,
            },
      },
    });
  };

  beforeEach(() => {
    const baseClient = new DefaultGitLabClient({ baseUrl: '' });
    client = new DeprecatedGitLabClient(baseClient);
  });

  describe('when client returns branch info', () => {
    beforeEach(() => {
      mockFetchProjectBranch(Promise.resolve(TEST_BRANCH));
    });

    it('requests project branch info', async () => {
      await fetchRef(TEST_PROJECT_PATH, TEST_BRANCH_NAME, client);

      expect(client.fetchProjectBranch).toHaveBeenCalledWith(TEST_PROJECT_PATH, TEST_BRANCH_NAME);
    });

    it('returns branch info', async () => {
      const result = await fetchRef(TEST_PROJECT_PATH, TEST_BRANCH_NAME, client);

      expect(result).toEqual({
        type: 'branch',
        sha: TEST_BRANCH.commit.id,
        branch: TEST_BRANCH,
      });
    });
  });

  describe.each`
    desc            | error
    ${'500 status'} | ${new Error(JSON.stringify({ status: 500 }))}
    ${'bogus'}      | ${new Error('bogus')}
  `('when client throws error: $desc', ({ error }) => {
    beforeEach(() => {
      mockFetchProjectBranch(Promise.reject(error));
    });

    it('throws', async () => {
      await expect(fetchRef(TEST_PROJECT_PATH, TEST_BRANCH_NAME, client)).rejects.toBe(error);
    });
  });

  describe('when client returns 404 for branch info', () => {
    beforeEach(() => {
      mockFetchProjectBranch(Promise.reject(new Error('Something 404 like')));
    });

    it('when ref is commit', async () => {
      mockFetchRefMetadata(TEST_COMMIT_SHA);

      const result = await fetchRef(TEST_PROJECT_PATH, TEST_COMMIT_REF, client);

      expect(result).toEqual({
        type: 'commit',
        sha: TEST_COMMIT_SHA,
      });
    });

    it('when ref is tag', async () => {
      mockFetchRefMetadata(TEST_COMMIT_SHA);

      const result = await fetchRef(TEST_PROJECT_PATH, TEST_TAG, client);

      expect(result).toEqual({
        type: 'tag',
        name: TEST_TAG,
        sha: TEST_COMMIT_SHA,
      });
    });

    it('when ref not found', async () => {
      mockFetchRefMetadata(undefined);

      await expect(fetchRef(TEST_PROJECT_PATH, TEST_TAG, client)).rejects.toThrow(
        '[khulnasoft-web-ide] ref not found in repository: v1.2',
      );
    });
  });
});
