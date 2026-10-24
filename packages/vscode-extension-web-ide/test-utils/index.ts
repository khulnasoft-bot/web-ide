import { GitLabBranch, GitLabProject, GitLabRef } from '@khulnasoft/vscode-mediator-commands';
import { CommandsInitialData } from '../src/types';
export const asRef = (branch: GitLabBranch): GitLabRef => ({
  type: 'branch',
  branch,
  sha: branch.commit.id,
});

export const TEST_PROJECT: GitLabProject = {
  default_branch: 'test-default-branch',
  id: 7,
  name: 'My Project',
  path_with_namespace: 'gitlab-org/gitlab',
  web_url: 'https://gitlab.com/gitlab-org/gitlab',
  can_create_merge_request_in: true,
  empty_repo: false,
};

export const TEST_BRANCH: GitLabBranch = {
  name: 'main',
  web_url: 'https://gitlab.com/gitlab-org/gitlab/-/branches/main',
  can_push: true,
  protected: false,
  default: false,
  commit: {
    id: '123456',
    short_id: '123',
    created_at: '2222-01-01',
    title: 'commit title',
    message: 'commit message',
    web_url: 'https://gitlab.com/gitlab-org/gitlab/-/branches/main/commits/foo',
  },
};

export const TEST_REF_BRANCH = asRef(TEST_BRANCH);

export const TEST_REF_COMMIT: GitLabRef = {
  type: 'commit',
  sha: '00110011001100110011001100',
};

export const TEST_COMMANDS_INITIAL_DATA: CommandsInitialData = {
  gitlabUrl: 'https://gitlab.com',
  project: TEST_PROJECT,
  ref: asRef(TEST_BRANCH),
  userPermissions: {
    createMergeRequestIn: true,
    pushCode: true,
    readMergeRequest: true,
  },
};
