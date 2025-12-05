import type { AuthProvider } from '@gitlab/gitlab-api-client';
import { DeprecatedGitLabClient as GitLabClient } from '@gitlab/gitlab-api-client';
import { createGitLabClient } from '@gitlab/gitlab-api-client-factory';
import {
  COMMAND_FETCH_FROM_API,
  COMMAND_FETCH_BUFFER_FROM_API,
  COMMAND_MEDIATOR_TOKEN,
} from '@gitlab/web-ide-interop';
import type { WebIdeExtensionConfig } from '@gitlab/web-ide-types';
import type { Command, VSBufferWrapper } from '../types';
import {
  COMMAND_COMMIT,
  COMMAND_CREATE_PROJECT_BRANCH,
  COMMAND_FETCH_FILE_RAW,
  COMMAND_FETCH_MERGE_REQUEST_DIFF_STATS,
  COMMAND_FETCH_PROJECT_BRANCHES,
  COMMAND_START,
} from '../constants';
import * as start from './start';
import * as fetchFromApi from './fetchFromApi';
import * as fetchBufferFromApi from './fetchBufferFromApi';
import * as fetchFileRaw from './fetchFileRaw';
import * as commit from './commit';
import { generateUniqueToken } from './utils/generateUniqueToken';
import { protectWithToken } from './utils/protectWithToken';

// region: types -------------------------------------------------------
// why: Export these types so that they can be easily consumed by the
//      vscode-extension-web-ide which actually calls these commands
export type FetchMergeRequestDiffStatsParams = Parameters<
  GitLabClient['fetchMergeRequestDiffStats']
>[0];
export type FetchMergeRequestDiffStatsResponse = Awaited<
  ReturnType<GitLabClient['fetchMergeRequestDiffStats']>
>;
export type FetchProjectBranchesParams = Parameters<GitLabClient['fetchProjectBranches']>[0];
export type FetchProjectBranchesResponse = Awaited<
  ReturnType<GitLabClient['fetchProjectBranches']>
>;
export type CreateProjectBranchParams = Parameters<GitLabClient['createProjectBranch']>[0];
export type CreateProjectBranchResponse = Awaited<ReturnType<GitLabClient['createProjectBranch']>>;

// region: factory function --------------------------------------------
interface CreateCommandsOptions {
  config: WebIdeExtensionConfig;
  bufferWrapper: VSBufferWrapper;
  auth?: AuthProvider;
  skipProtection?: boolean;
}

export const createCommands = async ({
  config,
  bufferWrapper,
  auth,
  skipProtection = false,
}: CreateCommandsOptions): Promise<Command[]> => {
  const defaultClient = createGitLabClient(config, auth);
  const client = new GitLabClient(defaultClient);

  const unprotectedCommands: Command[] = [
    {
      id: COMMAND_START,
      handler: start.commandFactory(config, client),
    },
    {
      id: COMMAND_FETCH_FILE_RAW,
      handler: fetchFileRaw.commandFactory(config, client, bufferWrapper),
    },
    {
      id: COMMAND_FETCH_FROM_API,
      handler: fetchFromApi.commandFactory(defaultClient),
    },
    {
      id: COMMAND_FETCH_BUFFER_FROM_API,
      handler: fetchBufferFromApi.commandFactory(defaultClient, bufferWrapper),
    },
    {
      id: COMMAND_FETCH_PROJECT_BRANCHES,
      handler: (params: FetchProjectBranchesParams) => client.fetchProjectBranches(params),
    },
    {
      id: COMMAND_FETCH_MERGE_REQUEST_DIFF_STATS,
      handler: (params: FetchMergeRequestDiffStatsParams) =>
        client.fetchMergeRequestDiffStats(params),
    },
    {
      id: COMMAND_CREATE_PROJECT_BRANCH,
      handler: (params: CreateProjectBranchParams) => client.createProjectBranch(params),
    },
    {
      id: COMMAND_COMMIT,
      handler: commit.commandFactory(config, client),
    },
  ];

  if (skipProtection) {
    return unprotectedCommands;
  }

  // why: We need to protect our commands with a secret token to prevent XSS
  // issue: https://gitlab.com/gitlab-org/gitlab/-/issues/417477
  const secretToken = await generateUniqueToken();

  const protectedCommands = unprotectedCommands.map(({ id, handler }) => ({
    id,
    handler: protectWithToken(secretToken, handler),
  }));

  const tokenCommand: Command = {
    id: COMMAND_MEDIATOR_TOKEN,
    handler: () => secretToken,
  };

  return [tokenCommand].concat(protectedCommands);
};
