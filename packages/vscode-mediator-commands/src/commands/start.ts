import type { gitlab, DeprecatedGitLabClient as GitLabClient } from '@gitlab/gitlab-api-client';
import type { WebIdeExtensionConfig } from '@khulnasoft/web-ide-types';
import type { GitLabRef, StartCommandOptions, StartCommandResponse } from '../types';
import { fetchRef } from './utils/fetchRef';
import { fetchProject } from './fetchProject';

type StartCommand = (options?: StartCommandOptions) => Promise<StartCommandResponse>;

const fetchMergeRequestFromConfig = async (config: WebIdeExtensionConfig, client: GitLabClient) => {
  if (!config.mrId) {
    return undefined;
  }

  // If we were given a `mrTargetProject` that's where the `mrId` actually lives
  const mrProjectPath = config.mrTargetProject || config.projectPath;
  return client.fetchMergeRequest(mrProjectPath, config.mrId);
};

const resolveRefName = (
  ref: string | undefined,
  project: gitlab.Project,
  mergeRequest?: gitlab.MergeRequest,
) => {
  if (ref) {
    return ref;
  }
  if (mergeRequest) {
    return mergeRequest.source_branch;
  }

  return project.default_branch;
};

const createEmptyBranch = (name: string): GitLabRef => ({
  type: 'branch',
  branch: {
    commit: {
      created_at: '',
      id: '',
      message: '',
      short_id: '',
      title: '',
      web_url: '',
    },
    web_url: '',
    name,
    protected: false,
    can_push: true,
    default: false,
  },
  sha: '',
});

const getMergeRequestContext = ({
  mergeRequest,
  branchName,
}: {
  mergeRequest?: gitlab.MergeRequest;
  branchName: string;
}): StartCommandResponse['mergeRequest'] => {
  if (!mergeRequest) {
    return undefined;
  }

  return {
    id: String(mergeRequest.id),
    baseSha: mergeRequest.diff_refs.base_sha,
    isMergeRequestBranch: branchName === mergeRequest.source_branch,
    mergeRequestUrl: mergeRequest.web_url,
  };
};

export const commandFactory =
  (config: WebIdeExtensionConfig, client: GitLabClient): StartCommand =>
  async (options: StartCommandOptions = {}): Promise<StartCommandResponse> => {
    const [userPermissions, project, mergeRequest] = await Promise.all([
      client.fetchProjectUserPermissions(config.projectPath),
      fetchProject(config, client.defaultClient),
      fetchMergeRequestFromConfig(config, client),
    ]);

    // If there's a ref coming from options, that means the user has selected this new ref
    const refName = resolveRefName(options.ref || config.ref, project, mergeRequest);

    if (project.empty_repo) {
      return {
        gitlabUrl: config.gitlabUrl,
        ref: createEmptyBranch(refName),
        files: [],
        repoRoot: config.repoRoot,
        project,
        userPermissions,
        forkInfo: config.forkInfo,
      };
    }

    const ref = await fetchRef(config.projectPath, refName, client);

    const tree = await client.fetchTree(config.projectPath, ref.sha);

    const blobs = tree.filter(item => item.type === 'blob');

    return {
      gitlabUrl: config.gitlabUrl,
      ref,
      files: blobs,
      repoRoot: config.repoRoot,
      project,
      userPermissions,
      mergeRequest: getMergeRequestContext({ mergeRequest, branchName: refName }),
      forkInfo: config.forkInfo,
    };
  };
