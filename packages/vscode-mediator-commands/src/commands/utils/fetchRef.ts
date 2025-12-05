import type { DeprecatedGitLabClient } from '@gitlab/gitlab-api-client';
import { is404Error } from '@gitlab/gitlab-api-client';
import type { GitLabRef } from '../../types';

const isCommittish = (ref: string, fullSha: string) =>
  // note: There's likely an edge case here where it's technically a tag but still
  //       matches the sha. We're not super interested in that case, let's just treat
  //       it as a short commit ref.
  fullSha.startsWith(ref);

export const fetchRef = async (
  projectPath: string,
  ref: string,
  client: DeprecatedGitLabClient,
): Promise<GitLabRef> => {
  const branch = await client.fetchProjectBranch(projectPath, ref).catch(e => {
    if (is404Error(e)) {
      return null;
    }

    throw e;
  });

  if (branch) {
    return {
      type: 'branch',
      branch,
      sha: branch.commit.id,
    };
  }

  const metadata = await client.fetchRefMetadata({ projectPath, ref });
  const fullSha = metadata.tree.lastCommit?.sha;

  if (!fullSha) {
    // TODO: Handle this more gracefully for the user https://gitlab.com/gitlab-org/gitlab-web-ide/-/issues/280
    throw new Error(`[gitlab-web-ide] ref not found in repository: ${ref}`);
  }

  if (isCommittish(ref, fullSha)) {
    return {
      type: 'commit',
      sha: fullSha,
    };
  }

  return {
    type: 'tag',
    name: ref,
    sha: fullSha,
  };
};
