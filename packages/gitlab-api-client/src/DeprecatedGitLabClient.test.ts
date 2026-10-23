import * as graphqlRequestModule from 'graphql-request';
import 'whatwg-fetch';

import { createHeadersProvider } from './createHeadersProvider';
import { DeprecatedGitLabClient as GitLabClient } from './DeprecatedGitLabClient';
import type { DefaultGitLabConfig } from './DefaultGitLabClient';
import { DefaultGitLabClient } from './DefaultGitLabClient';
import type { gitlab } from './types';
import {
  createProjectBranchMutation,
  getMergeRequestDiffStatsQuery,
  getProjectUserPermissionsQuery,
  getRefMetadataQuery,
  searchProjectBranchesQuery,
} from './graphql';
import * as mockVariables from '../test-utils/graphql/mockVariables';
import * as mockResponses from '../test-utils/graphql/mockResponses';

const { GraphQLClient } = graphqlRequestModule;

const TEST_AUTH_TOKEN = '123456';
const TEST_AUTH_TOKEN_HEADERS = {
  'PRIVATE-TOKEN': TEST_AUTH_TOKEN,
};
// why: Test that relative URL works
const TEST_BASE_URL = 'https://gdk.test/test';
const TEST_RESPONSE_OBJ = { msg: 'test response' };
const TEST_EXTRA_HEADERS = {
  Extra: 'Header-Value',
  test: '123',
};

describe('DeprecatedGitLabClient', () => {
  let gqlClientSpy: jest.SpyInstance<graphqlRequestModule.GraphQLClient>;
  let gqlRequestSpy: jest.SpyInstance<Promise<unknown>>;
  let fetchSpy: jest.SpiedFunction<typeof fetch>;
  let subject: GitLabClient;

  const createSubject = (config?: Partial<DefaultGitLabConfig>) => {
    const defaultClient = new DefaultGitLabClient({
      auth: createHeadersProvider({ 'PRIVATE-TOKEN': TEST_AUTH_TOKEN }),
      baseUrl: TEST_BASE_URL,
      ...config,
    });
    subject = new GitLabClient(defaultClient);
  };

  const mockResponse = (response: Response) =>
    fetchSpy.mockImplementation(() => Promise.resolve(response));

  beforeEach(() => {
    gqlRequestSpy = jest.spyOn(GraphQLClient.prototype, 'request').mockResolvedValue(undefined);
    gqlClientSpy = jest
      .spyOn(graphqlRequestModule, 'GraphQLClient')
      .mockImplementation((...args) => new GraphQLClient(...args));
    fetchSpy = jest.spyOn(window, 'fetch');

    mockResponse(
      new Response(JSON.stringify(TEST_RESPONSE_OBJ), { status: 200, statusText: 'OK' }),
    );
  });

  describe('default', () => {
    beforeEach(() => {
      createSubject();
    });

    it('creates graphql client', () => {
      expect(gqlClientSpy).toHaveBeenCalledWith(`${TEST_BASE_URL}/api/graphql`);
    });

    describe.each([
      [
        'fetchProject',
        () => subject.fetchProject('lorem/ipsum'),
        `${TEST_BASE_URL}/api/v4/projects/lorem%2Fipsum`,
      ],
      [
        'fetchProjectBranch',
        () => subject.fetchProjectBranch('lorem/ipsum', 'test/ref'),
        `${TEST_BASE_URL}/api/v4/projects/lorem%2Fipsum/repository/branches/test%2Fref`,
      ],
      [
        'fetchMergeRequest',
        () => subject.fetchMergeRequest('lorem/ipsum', '2'),
        `${TEST_BASE_URL}/api/v4/projects/lorem%2Fipsum/merge_requests/2`,
      ],
      [
        'fetchTree',
        () => subject.fetchTree('lorem/ipsum', 'test/ref'),
        `${TEST_BASE_URL}/api/v4/projects/lorem%2Fipsum/repository/tree?ref=test%2Fref&recursive=true&pagination=none`,
      ],
    ])('%s', (_, act, expectedURL) => {
      it('fetches from GitLab API', async () => {
        const actual = await act();

        expect(actual).toEqual(TEST_RESPONSE_OBJ);
        expect(fetchSpy).toHaveBeenCalledWith(expectedURL, {
          method: 'GET',
          headers: TEST_AUTH_TOKEN_HEADERS,
        });
      });

      it('if response fails, throws', async () => {
        const resp = new Response('', { status: 404 });
        mockResponse(resp);

        await expect(act()).rejects.toStrictEqual(
          // why: We use `objectContaining` to test the actual props of the error objects. Otherwise, Jest just tests the message.
          expect.objectContaining(new Error(JSON.stringify({ status: 404 }))),
        );
      });
    });

    describe.each([
      {
        description: 'fetchMergeRequestDiffStats',
        act: () => subject.fetchMergeRequestDiffStats({ mergeRequestId: '7' }),
        response: mockResponses.getMergeRequestDiffStats,
        expectedQuery: getMergeRequestDiffStatsQuery,
        expectedVariables: { gid: 'gid://gitlab/MergeRequest/7' },
        expectedReturn: mockResponses.getMergeRequestDiffStats.mergeRequest.diffStats,
      },
      {
        description: 'fetchProjectUserPermissions',
        act: () => subject.fetchProjectUserPermissions('lorem/ipsum'),
        response: mockResponses.getProjectUserPermissions,
        expectedQuery: getProjectUserPermissionsQuery,
        expectedVariables: { projectPath: 'lorem/ipsum' },
        expectedReturn: mockResponses.getProjectUserPermissions.project.userPermissions,
      },
      {
        description: 'fetchProjectBranches',
        act: () => subject.fetchProjectBranches(mockVariables.searchProjectBranches),
        response: mockResponses.searchProjectBranches,
        expectedQuery: searchProjectBranchesQuery,
        expectedVariables: mockVariables.searchProjectBranches,
        expectedReturn: mockResponses.searchProjectBranches.project.repository.branchNames,
      },
      {
        description: 'createProjectBranch',
        act: () => subject.createProjectBranch(mockVariables.createProjectBranch),
        response: mockResponses.createProjectBranch,
        expectedQuery: createProjectBranchMutation,
        expectedVariables: mockVariables.createProjectBranch,
        expectedReturn: mockResponses.createProjectBranch.createBranch,
      },
      {
        description: 'fetchRefMetadata',
        act: () => subject.fetchRefMetadata(mockVariables.getRefMetadata),
        response: mockResponses.getRefMetadata,
        expectedQuery: getRefMetadataQuery,
        expectedVariables: mockVariables.getRefMetadata,
        expectedReturn: mockResponses.getRefMetadata.project.repository,
      },
    ])('$description', ({ act, response, expectedQuery, expectedVariables, expectedReturn }) => {
      it('makes graphql request', async () => {
        gqlRequestSpy.mockResolvedValue(response);
        expect(gqlRequestSpy).not.toHaveBeenCalled();

        const result = await act();

        expect(gqlRequestSpy).toHaveBeenCalledWith(
          expectedQuery,
          expectedVariables,
          TEST_AUTH_TOKEN_HEADERS,
        );
        expect(result).toEqual(expectedReturn);
      });
    });

    describe('fetchFileRaw', () => {
      it('fetched buffer from GitLab API', async () => {
        const expectedBuffer = Buffer.from('Hello world!');
        mockResponse(new Response(expectedBuffer, { status: 200, statusText: 'OK' }));

        const actual = await subject.fetchFileRaw('lorem/ipsum', 'test/ref', 'docs/README.md');

        expect(Buffer.from(actual)).toEqual(expectedBuffer);
        expect(fetchSpy).toHaveBeenCalledWith(
          `${TEST_BASE_URL}/api/v4/projects/lorem%2Fipsum/repository/files/docs%2FREADME.md/raw?ref=test%2Fref`,
          { method: 'GET', headers: TEST_AUTH_TOKEN_HEADERS },
        );
      });
    });

    describe('commit', () => {
      it('posts commit to GitLab API', async () => {
        const TEST_COMMIT_PAYLOAD: gitlab.CommitPayload = {
          branch: 'main-test-patch',
          start_sha: '',
          commit_message: 'Hello world!',
          actions: [],
        };

        const actual = await subject.commit('lorem/ipsum', TEST_COMMIT_PAYLOAD);

        expect(actual).toEqual(TEST_RESPONSE_OBJ);
        expect(fetchSpy).toHaveBeenCalledWith(
          `${TEST_BASE_URL}/api/v4/projects/lorem%2Fipsum/repository/commits`,
          {
            method: 'POST',
            body: JSON.stringify(TEST_COMMIT_PAYLOAD),
            headers: {
              ...TEST_AUTH_TOKEN_HEADERS,
              'Content-Type': 'application/json',
            },
          },
        );
      });
    });
  });

  it.each`
    desc                   | options                                | expectedHeaders
    ${'without authToken'} | ${{ auth: undefined }}                 | ${{}}
    ${'with httpHeaders'}  | ${{ httpHeaders: TEST_EXTRA_HEADERS }} | ${{ 'PRIVATE-TOKEN': TEST_AUTH_TOKEN, ...TEST_EXTRA_HEADERS }}
  `('$desc, headers will be $expectedHeaders', async ({ options, expectedHeaders }) => {
    createSubject(options);

    await subject.fetchProjectBranch('lorem/ipsum', 'test/ref');

    expect(fetchSpy).toHaveBeenCalledWith(
      `${TEST_BASE_URL}/api/v4/projects/lorem%2Fipsum/repository/branches/test%2Fref`,
      { method: 'GET', headers: expectedHeaders },
    );
  });
});
