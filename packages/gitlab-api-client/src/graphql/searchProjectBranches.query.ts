import { gql } from 'graphql-request';

export const searchProjectBranchesQuery = gql`
  query searchProjectBranches(
    $projectPath: ID!
    $searchPattern: String!
    $limit: Int!
    $offset: Int!
  ) {
    project(fullPath: $projectPath) {
      repository {
        branchNames(searchPattern: $searchPattern, limit: $limit, offset: $offset)
      }
    }
  }
`;

export interface SearchProjectBranchesVariables {
  projectPath: string;
  searchPattern: string;
  limit: number;
  offset: number;
}

export interface SearchProjectBranchesResult {
  project: {
    repository: {
      branchNames: string[] | null;
    };
  };
}
