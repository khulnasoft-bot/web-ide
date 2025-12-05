import type { gitlab } from './types';
import type {
  CreateProjectBranchResult,
  CreateProjectBranchVariables,
  GetMergeRequestDiffStatsResult,
  GetMergeRequestDiffStatsVariables,
  GetProjectUserPermissionsResult,
  GetProjectUserPermissionsVariables,
  GetRefMetadataResult,
  GetRefMetadataVariables,
  SearchProjectBranchesResult,
  SearchProjectBranchesVariables,
} from './graphql';
import {
  createProjectBranchMutation,
  getMergeRequestDiffStatsQuery,
  getProjectUserPermissionsQuery,
  getRefMetadataQuery,
  searchProjectBranchesQuery,
} from './graphql';
import { createGraphQLRequest } from './createGraphQLRequest';
import type { DefaultGitLabClient } from './DefaultGitLabClient';
import * as gitlabApi from './gitlabApi';

/**
 * @deprecated
 */
export class DeprecatedGitLabClient {
  readonly #client: DefaultGitLabClient;

  constructor(client: DefaultGitLabClient) {
    this.#client = client;
  }

  get defaultClient() {
    return this.#client;
  }

  async fetchRefMetadata(params: GetRefMetadataVariables) {
    const request = createGraphQLRequest<GetRefMetadataResult, GetRefMetadataVariables>(
      getRefMetadataQuery,
      params,
    );

    const result = await this.#client.fetchFromApi(request);

    return result.project.repository;
  }

  async fetchProjectUserPermissions(projectPath: string) {
    const request = createGraphQLRequest<
      GetProjectUserPermissionsResult,
      GetProjectUserPermissionsVariables
    >(getProjectUserPermissionsQuery, {
      projectPath,
    });
    const result = await this.#client.fetchFromApi(request);

    return result.project.userPermissions;
  }

  async fetchProjectBranches(params: SearchProjectBranchesVariables) {
    const request = createGraphQLRequest<
      SearchProjectBranchesResult,
      SearchProjectBranchesVariables
    >(searchProjectBranchesQuery, params);
    const result = await this.#client.fetchFromApi(request);

    return result.project.repository.branchNames || [];
  }

  async createProjectBranch(params: CreateProjectBranchVariables) {
    const request = createGraphQLRequest<CreateProjectBranchResult, CreateProjectBranchVariables>(
      createProjectBranchMutation,
      params,
    );
    const result = await this.#client.fetchFromApi(request);

    return result.createBranch;
  }

  async fetchMergeRequestDiffStats({ mergeRequestId }: { mergeRequestId: string }) {
    const gid = `gid://gitlab/MergeRequest/${mergeRequestId}`;

    const request = createGraphQLRequest<
      GetMergeRequestDiffStatsResult,
      GetMergeRequestDiffStatsVariables
    >(getMergeRequestDiffStatsQuery, { gid });
    const result = await this.#client.fetchFromApi(request);

    return result.mergeRequest.diffStats;
  }

  fetchProject(projectId: string): Promise<gitlab.Project> {
    const request = gitlabApi.getProject.createRequest({
      projectId,
    });

    return this.#client.fetchFromApi(request);
  }

  fetchMergeRequest(projectId: string, mrId: string): Promise<gitlab.MergeRequest> {
    const request = gitlabApi.getMergeRequest.createRequest({
      projectId,
      mrId,
    });

    return this.#client.fetchFromApi(request);
  }

  fetchProjectBranch(projectId: string, branchName: string): Promise<gitlab.Branch> {
    const request = gitlabApi.getProjectBranch.createRequest({
      projectId,
      branchName,
    });

    return this.#client.fetchFromApi(request);
  }

  fetchTree(projectId: string, ref: string): Promise<gitlab.RepositoryTreeItem[]> {
    const request = gitlabApi.getProjectRepositoryTree.createRequest({
      projectId,
      ref,
      recursive: 'true',
      pagination: 'none',
    });

    return this.#client.fetchFromApi(request);
  }

  commit(projectId: string, payload: gitlab.CommitPayload): Promise<gitlab.Commit> {
    const request = gitlabApi.postProjectCommit.createRequest(
      {
        projectId,
      },
      payload,
    );

    return this.#client.fetchFromApi(request);
  }

  async fetchFileRaw(projectId: string, ref: string, path: string): Promise<ArrayBuffer> {
    const request = gitlabApi.getRawFile.createRequest({
      projectId,
      ref,
      path,
    });

    return this.#client.fetchBufferFromApi(request);
  }
}
