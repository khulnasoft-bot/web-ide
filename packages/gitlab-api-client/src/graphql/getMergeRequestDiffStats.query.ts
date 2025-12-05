import { gql } from 'graphql-request';

export const getMergeRequestDiffStatsQuery = gql`
  query getMergeRequestDiffStats($gid: MergeRequestID!) {
    mergeRequest(id: $gid) {
      diffStats {
        path
        additions
        deletions
      }
    }
  }
`;

export interface GetMergeRequestDiffStatsVariables {
  gid: string;
}

export interface GetMergeRequestDiffStatsResult {
  mergeRequest: {
    diffStats: { path: string; additions: number; deletions: number }[];
  };
}
