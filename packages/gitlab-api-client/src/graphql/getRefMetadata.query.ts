import { gql } from 'graphql-request';

export const getRefMetadataQuery = gql`
  query getRefMetadata($ref: String!, $projectPath: ID!) {
    project(fullPath: $projectPath) {
      repository {
        tree(ref: $ref) {
          lastCommit {
            sha
          }
        }
      }
    }
  }
`;

export interface GetRefMetadataVariables {
  ref: string;
  projectPath: string;
}

export interface GetRefMetadataResult {
  project: {
    repository: {
      tree: {
        lastCommit: null | {
          sha: string;
        };
      };
    };
  };
}
