import { createGraphQLRequest } from './createGraphQLRequest';

type TestResult = {
  project: {
    count: number;
  };
};
type TestVariables = {
  projectId: string;
  search: string;
};

const TEST_QUERY = 'query foo { }';

describe('createGraphQLRequest', () => {
  it('returns a GraphQLRequest', () => {
    const variables = {
      projectId: '123/456',
      search: 'meaning',
    };

    expect(createGraphQLRequest<TestResult, TestVariables>(TEST_QUERY, variables)).toEqual({
      type: 'graphql',
      query: TEST_QUERY,
      variables,
    });
  });
});
