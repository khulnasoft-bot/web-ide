import type {
  CreateProjectBranchVariables,
  GetRefMetadataVariables,
  SearchProjectBranchesVariables,
} from '../../src/graphql';

export const createProjectBranch: CreateProjectBranchVariables = {
  name: 'new-branch-test',
  projectPath: 'lorem/ipsum',
  ref: '111000',
};

export const getRefMetadata: GetRefMetadataVariables = {
  projectPath: 'lorem/ipsum',
  ref: '121000',
};

export const searchProjectBranches: SearchProjectBranchesVariables = {
  limit: 100,
  offset: 0,
  projectPath: 'lorem/ipsum',
  searchPattern: 'foo-*',
};
