import type { gitlab } from './types';
import { declareEndpoint } from './endpoints';

export const getProject = declareEndpoint('GET', 'projects/:projectId')
  .withPathParams<{ projectId: string }>()
  .withReturnType<gitlab.Project>()
  .build();

export const getProjectPushRules = declareEndpoint('GET', 'projects/:projectId/push_rule')
  .withPathParams<{ projectId: string }>()
  .withReturnType<gitlab.ProjectPushRules>()
  .build();

export const getMergeRequest = declareEndpoint('GET', 'projects/:projectId/merge_requests/:mrId')
  .withPathParams<{ projectId: string; mrId: string }>()
  .withReturnType<gitlab.MergeRequest>()
  .build();

export const getProjectBranch = declareEndpoint(
  'GET',
  'projects/:projectId/repository/branches/:branchName',
)
  .withPathParams<{ projectId: string; branchName: string }>()
  .withReturnType<gitlab.Branch>()
  .build();

export const deleteProjectBranch = declareEndpoint(
  'DELETE',
  'projects/:projectId/repository/branches/:branchName',
)
  .withPathParams<{ projectId: string; branchName: string }>()
  .withReturnType<undefined>()
  .build();

export const getProjectRepositoryTree = declareEndpoint(
  'GET',
  'projects/:projectId/repository/tree',
)
  .withPathParams<{ projectId: string; ref: string; recursive: string; pagination: string }>()
  .withReturnType<gitlab.RepositoryTreeItem[]>()
  .build();

export const postProjectCommit = declareEndpoint('POST', 'projects/:projectId/repository/commits')
  .withPathParams<{ projectId: string }>()
  .withBodyType<gitlab.CommitPayload>()
  .withReturnType<gitlab.Commit>()
  .build();

export const getCommit = declareEndpoint('GET', 'projects/:projectId/repository/commits/:sha')
  .withPathParams<{ projectId: string; sha: string }>()
  .withReturnType<gitlab.CommitDetails>()
  .build();

export const getCommitDiff = declareEndpoint(
  'GET',
  'projects/:projectId/repository/commits/:sha/diff',
)
  .withPathParams<{ projectId: string; sha: string }>()
  .withReturnType<gitlab.CommitDiff[]>()
  .build();

export const getRawFile = declareEndpoint('GET', 'projects/:projectId/repository/files/:path/raw')
  .withPathParams<{ projectId: string; path: string; ref: string }>()
  .withBufferReturnType()
  .build();

export const getCommitSequence = declareEndpoint(
  'GET',
  'projects/:projectId/repository/commits/:sha/sequence',
)
  .withPathParams<{ projectId: string; sha: string }>()
  .withReturnType<{ count: number }>()
  .build();
