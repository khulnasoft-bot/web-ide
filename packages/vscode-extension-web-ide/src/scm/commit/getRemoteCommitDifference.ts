import type { DefaultGitLabClient } from '@gitlab/gitlab-api-client';
import { gitlabApi } from '@gitlab/gitlab-api-client';
import type { GitLabRef } from '@gitlab/vscode-mediator-commands';

const getCommitSequence = async (
  apiClient: DefaultGitLabClient,
  projectId: string,
  sha: string,
): Promise<number> => {
  const response = await apiClient.fetchFromApi(
    gitlabApi.getCommitSequence.createRequest({ projectId, sha }),
  );
  return response.count;
};

export const getRemoteCommitDifference = async (
  apiClient: DefaultGitLabClient,
  projectId: string,
  ref: GitLabRef,
): Promise<number> => {
  if (ref.type !== 'branch' || ref.sha?.length === 0) {
    return 0; // No commits to count for non-branch refs
  }

  const localCommitCount = await getCommitSequence(apiClient, projectId, ref.sha);

  const remoteBranch = await apiClient.fetchFromApi(
    gitlabApi.getProjectBranch.createRequest({
      projectId,
      branchName: ref.branch.name,
    }),
  );
  const remoteCommitCount = await getCommitSequence(apiClient, projectId, remoteBranch.commit.id);

  return remoteCommitCount - localCommitCount;
};
