import {
  COMMAND_START,
  COMMAND_FETCH_FILE_RAW,
  COMMAND_COMMIT,
  COMMAND_FETCH_MERGE_REQUEST_DIFF_STATS,
  COMMAND_FETCH_PROJECT_BRANCHES,
  COMMAND_CREATE_PROJECT_BRANCH,
} from '@khulnasoft/vscode-mediator-commands';
import type {
  StartCommandResponse,
  VSCodeBuffer,
  FetchMergeRequestDiffStatsParams,
  FetchMergeRequestDiffStatsResponse,
  FetchProjectBranchesParams,
  FetchProjectBranchesResponse,
  CreateProjectBranchParams,
  CreateProjectBranchResponse,
  GitLabCommitPayload,
  StartCommandOptions,
} from '@khulnasoft/vscode-mediator-commands';
import { executeMediatorCommand } from './executor';

export const start = async (options: StartCommandOptions = {}): Promise<StartCommandResponse> =>
  executeMediatorCommand(COMMAND_START, options);

export const fetchFileRaw = async (ref: string, path: string): Promise<VSCodeBuffer> =>
  executeMediatorCommand(COMMAND_FETCH_FILE_RAW, ref, path);

export const fetchMergeRequestDiffStats = async (
  params: FetchMergeRequestDiffStatsParams,
): Promise<FetchMergeRequestDiffStatsResponse> =>
  executeMediatorCommand(COMMAND_FETCH_MERGE_REQUEST_DIFF_STATS, params);

export const fetchProjectBranches = (
  params: FetchProjectBranchesParams,
): Promise<FetchProjectBranchesResponse> =>
  executeMediatorCommand(COMMAND_FETCH_PROJECT_BRANCHES, params);

export const createProjectBranch = (
  params: CreateProjectBranchParams,
): Promise<CreateProjectBranchResponse> =>
  executeMediatorCommand(COMMAND_CREATE_PROJECT_BRANCH, params);

export const commit = (payload: GitLabCommitPayload) =>
  executeMediatorCommand(COMMAND_COMMIT, payload);

export { getConfig } from './config';
export * from './messages';
export { setupMediatorCommandExecutor } from './executor';
