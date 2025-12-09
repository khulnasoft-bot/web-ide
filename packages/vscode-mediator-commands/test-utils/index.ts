import {
  gitlab,
  DeprecatedGitLabClient as GitLabClient,
  DefaultGitLabClient,
  DefaultAuthProvider,
} from '@gitlab/gitlab-api-client';
import { createPrivateTokenHeadersProvider } from '@gitlab/gitlab-api-client-factory';
import { createConfig } from '@khulnasoft/utils-test';
import { WebIdeExtensionConfig } from '@khulnasoft/web-ide-types';

export const TEST_DEFAULT_BRANCH = 'test-default-branch';

export const TEST_CONFIG: WebIdeExtensionConfig = {
  ...createConfig(),
  repoRoot: '/repo/root/lorem/ipsum',
};

export const TEST_COMMIT_PAYLOAD: gitlab.CommitPayload = {
  actions: [],
  branch: 'main-patch-123',
  commit_message: 'Test! Hello!',
};

export const TEST_COMMIT_ID = '000000111111';

export const createTestClient = () => {
  const token = TEST_CONFIG.auth.type === 'token' ? TEST_CONFIG.auth.token : '';

  const defaultClient = new DefaultGitLabClient({
    baseUrl: TEST_CONFIG.gitlabUrl,
    auth: createPrivateTokenHeadersProvider(new DefaultAuthProvider(token)),
  });

  return new GitLabClient(defaultClient);
};

export const createTestProject = (projectPath: string): gitlab.Project => ({
  id: 7,
  name: 'My Project',
  path_with_namespace: projectPath,
  web_url: `https://example.com/${projectPath}`,
  default_branch: TEST_DEFAULT_BRANCH,
  can_create_merge_request_in: true,
  empty_repo: false,
});

export const createTestBranch = (projectPath: string, ref: string): gitlab.Branch => ({
  name: ref,
  web_url: `https://example.com/${projectPath}/${ref}`,
  can_push: true,
  protected: false,
  default: false,
  commit: {
    created_at: '',
    id: TEST_COMMIT_ID,
    message: 'Hello! Test!',
    short_id: '000000',
    title: 'Hello! Test!',
    web_url: `https://example.com/${projectPath}/commits/000000`,
  },
});

export const createRepositoryTreeItem = (
  path: string,
  type: 'blob' | 'tree',
): gitlab.RepositoryTreeItem => ({
  name: path,
  id: path,
  path,
  type,
  mode: '100644',
});
