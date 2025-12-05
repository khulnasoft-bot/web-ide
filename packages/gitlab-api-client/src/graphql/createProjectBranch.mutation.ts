import { gql } from 'graphql-request';

export const createProjectBranchMutation = gql`
  mutation createProjectBranch($projectPath: ID!, $name: String!, $ref: String!) {
    createBranch(input: { projectPath: $projectPath, name: $name, ref: $ref }) {
      errors
      branch {
        name
      }
    }
  }
`;

export interface CreateProjectBranchVariables {
  projectPath: string;
  name: string;
  ref: string;
}

export interface CreateProjectBranchResult {
  createBranch: {
    errors: string[];
    branch: {
      name: string;
    };
  };
}
