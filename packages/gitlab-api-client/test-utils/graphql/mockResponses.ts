import type {
  CreateProjectBranchResult,
  GetMergeRequestDiffStatsResult,
  GetProjectUserPermissionsResult,
  GetRefMetadataResult,
  SearchProjectBranchesResult,
} from '../../src/graphql';

export const createProjectBranch: CreateProjectBranchResult = {
  createBranch: {
    branch: {
      name: 'new-branch-test',
    },
    errors: [],
  },
};

export const getMergeRequestDiffStats: GetMergeRequestDiffStatsResult = {
  mergeRequest: {
    diffStats: [
      {
        path: 'README.md',
        additions: 7,
        deletions: 77,
      },
    ],
  },
};

export const getProjectUserPermissions: GetProjectUserPermissionsResult = {
  project: {
    userPermissions: {
      createMergeRequestIn: true,
      pushCode: false,
      readMergeRequest: true,
    },
  },
};

export const getRefMetadata: GetRefMetadataResult = {
  project: {
    repository: {
      tree: {
        lastCommit: {
          sha: '121000',
        },
      },
    },
  },
};

export const searchProjectBranches: SearchProjectBranchesResult = {
  project: {
    repository: {
      branchNames: ['foo', 'bar'],
    },
  },
};
