import { gql } from 'graphql-request';

export const getProjectUserPermissionsQuery = gql`
  query getProjectUserPermissions($projectPath: ID!) {
    project(fullPath: $projectPath) {
      userPermissions {
        createMergeRequestIn
        readMergeRequest
        pushCode
      }
    }
  }
`;

export interface GetProjectUserPermissionsVariables {
  projectPath: string;
}

export interface ProjectUserPermissions {
  createMergeRequestIn: boolean;
  readMergeRequest: boolean;
  pushCode: boolean;
}

export interface GetProjectUserPermissionsResult {
  project: {
    userPermissions: ProjectUserPermissions;
  };
}
