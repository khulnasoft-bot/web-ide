import type { GetRequest, GraphQLRequest, PostRequest } from '@gitlab/web-ide-interop';
import * as graphqlRequestModule from 'graphql-request';
import 'whatwg-fetch';
import { createHeadersProvider } from './createHeadersProvider';
import type { DefaultGitLabConfig } from './DefaultGitLabClient';
import { DefaultGitLabClient } from './DefaultGitLabClient';

const { GraphQLClient, gql } = graphqlRequestModule;

const TEST_AUTH_TOKEN = '123456';
const TEST_AUTH_TOKEN_HEADERS = {
  'PRIVATE-TOKEN': TEST_AUTH_TOKEN,
};
// why: Test that relative URL works
const TEST_BASE_URL = 'https://gdk.test/test';
const TEST_RESPONSE_OBJ = { msg: 'test response' };

describe('DefaultGitLabClient', () => {
  let fetchSpy: jest.SpiedFunction<typeof fetch>;
  let gqlClientSpy: jest.SpyInstance<graphqlRequestModule.GraphQLClient>;
  let gqlRequestSpy: jest.SpyInstance<Promise<unknown>>;
  let subject: DefaultGitLabClient;

  const createSubject = (config?: Partial<DefaultGitLabConfig>) => {
    subject = new DefaultGitLabClient({
      auth: createHeadersProvider({ 'PRIVATE-TOKEN': TEST_AUTH_TOKEN }),
      baseUrl: TEST_BASE_URL,
      ...config,
    });
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

    describe('fetchFromApi', () => {
      describe('GetRequest', () => {
        const getRequest: GetRequest<string> = {
          type: 'rest',
          method: 'GET',
          path: 'projects/gitlab-org%2fgitlab',
          searchParams: { test: 'value' },
        };

        describe('with custom headers', () => {
          it('returns successful response', async () => {
            const expectedUrl = `${TEST_BASE_URL}/api/v4/projects/gitlab-org%2fgitlab?test=value`;
            const actual = await subject.fetchFromApi({
              ...getRequest,
              headers: { custom: 'test' },
            });

            expect(actual).toEqual(TEST_RESPONSE_OBJ);
            expect(fetchSpy).toHaveBeenCalledWith(expectedUrl, {
              method: 'GET',
              headers: {
                ...TEST_AUTH_TOKEN_HEADERS,
                custom: 'test',
              },
            });
          });
        });

        it('returns successful response', async () => {
          const expectedUrl = `${TEST_BASE_URL}/api/v4/projects/gitlab-org%2fgitlab?test=value`;
          const actual = await subject.fetchFromApi(getRequest);

          expect(actual).toEqual(TEST_RESPONSE_OBJ);
          expect(fetchSpy).toHaveBeenCalledWith(expectedUrl, {
            method: 'GET',
            headers: {
              ...TEST_AUTH_TOKEN_HEADERS,
            },
          });
        });

        it('if response fails, throws', async () => {
          const resp = new Response('', { status: 404 });
          mockResponse(resp);

          await expect(subject.fetchFromApi(getRequest)).rejects.toStrictEqual(
            // why: We use `objectContaining` to test the actual props of the error objects. Otherwise, Jest just tests the message.
            expect.objectContaining(new Error(JSON.stringify({ status: 404 }))),
          );
        });
      });

      describe('PostRequest', () => {
        const postRequest: PostRequest<string> = {
          type: 'rest',
          method: 'POST',
          path: 'code_suggestions/tokens',
          body: { test: 'body' },
        };

        it('returns successful response', async () => {
          const expectedUrl = `${TEST_BASE_URL}/api/v4/code_suggestions/tokens`;
          const actual = await subject.fetchFromApi(postRequest);

          expect(actual).toEqual(TEST_RESPONSE_OBJ);
          expect(fetchSpy).toHaveBeenCalledWith(expectedUrl, {
            method: 'POST',
            body: '{"test":"body"}',
            headers: {
              ...TEST_AUTH_TOKEN_HEADERS,
              'Content-Type': 'application/json',
            },
          });
        });

        describe('with custom headers', () => {
          it('returns successful response', async () => {
            const expectedUrl = `${TEST_BASE_URL}/api/v4/code_suggestions/tokens`;
            const actual = await subject.fetchFromApi({
              ...postRequest,
              headers: { custom: 'test' },
            });

            expect(actual).toEqual(TEST_RESPONSE_OBJ);
            expect(fetchSpy).toHaveBeenCalledWith(expectedUrl, {
              method: 'POST',
              body: '{"test":"body"}',
              headers: {
                ...TEST_AUTH_TOKEN_HEADERS,
                'Content-Type': 'application/json',
                custom: 'test',
              },
            });
          });
        });

        it('if response fails, throws', async () => {
          const resp = new Response('', { status: 404 });
          mockResponse(resp);

          await expect(subject.fetchFromApi(postRequest)).rejects.toStrictEqual(
            // why: We use `objectContaining` to test the actual props of the error objects. Otherwise, Jest just tests the message.
            expect.objectContaining(new Error(JSON.stringify({ status: 404 }))),
          );
        });
      });

      describe('DeleteRequest', () => {
        const deleteRequest = {
          type: 'rest' as const,
          method: 'DELETE' as const,
          path: 'projects/123/merge_requests/456',
        };

        it('returns empty object when response is 204 No Content', async () => {
          const resp = new Response('', { status: 204, statusText: 'No Content' });
          mockResponse(resp);

          const actual = await subject.fetchFromApi(deleteRequest);

          expect(actual).toEqual({});
          expect(fetchSpy).toHaveBeenCalledWith(
            `${TEST_BASE_URL}/api/v4/projects/123/merge_requests/456`,
            {
              method: 'DELETE',
              headers: {
                ...TEST_AUTH_TOKEN_HEADERS,
              },
            },
          );
        });

        it('returns empty object when content-type is not JSON', async () => {
          const resp = new Response('some text', {
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': 'text/plain' },
          });
          mockResponse(resp);

          const actual = await subject.fetchFromApi(deleteRequest);

          expect(actual).toEqual({});
        });

        it('returns JSON response when content-type is application/json', async () => {
          const expectedDeleteResponse = { message: 'Merge request deleted successfully' };
          const resp = new Response(JSON.stringify(expectedDeleteResponse), {
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': 'application/json' },
          });
          mockResponse(resp);

          const actual = await subject.fetchFromApi(deleteRequest);

          expect(actual).toEqual(expectedDeleteResponse);
        });

        it('includes custom headers in request', async () => {
          const resp = new Response('', { status: 204, statusText: 'No Content' });
          mockResponse(resp);

          await subject.fetchFromApi({
            ...deleteRequest,
            headers: { custom: 'test' },
          });

          expect(fetchSpy).toHaveBeenCalledWith(
            `${TEST_BASE_URL}/api/v4/projects/123/merge_requests/456`,
            {
              method: 'DELETE',
              headers: {
                ...TEST_AUTH_TOKEN_HEADERS,
                custom: 'test',
              },
            },
          );
        });

        it('if response fails, throws', async () => {
          const resp = new Response('', { status: 403 });
          mockResponse(resp);

          await expect(subject.fetchFromApi(deleteRequest)).rejects.toStrictEqual(
            // why: We use `objectContaining` to test the actual props of the error objects. Otherwise, Jest just tests the message.
            expect.objectContaining(new Error(JSON.stringify({ status: 403 }))),
          );
        });
      });

      describe('GraphQLRequest', () => {
        const graphQLRequest: GraphQLRequest<string> = {
          type: 'graphql',
          query: gql`
            query GetProject($namespaceWithPath: ID!) {
              project(fullPath: $namespaceWithPath) {
                name
                description
              }
            }
          `,
          variables: {
            fullPath: 'gitlab-org/gitlab',
          },
        };

        const project = { name: 'test name', description: 'test description' };

        it('returns successful response', async () => {
          gqlRequestSpy.mockResolvedValue({ project });
          expect(gqlRequestSpy).not.toHaveBeenCalled();

          const result = await subject.fetchFromApi(graphQLRequest);

          expect(gqlRequestSpy).toHaveBeenCalledWith(
            graphQLRequest.query,
            graphQLRequest.variables,
            TEST_AUTH_TOKEN_HEADERS,
          );
          expect(result).toEqual({ project });
        });

        it('if response fails, throws', async () => {
          gqlRequestSpy.mockRejectedValue(new Error('test'));

          await expect(subject.fetchFromApi(graphQLRequest)).rejects.toThrowError();
        });
      });
    });

    describe('fetchBufferFromApi', () => {
      it('returns buffer of data response', async () => {
        const expectedUrl = `${TEST_BASE_URL}/api/v4/projects/gitlab-org%2fgitlab?test=value`;
        const expectedResponse = new Uint8Array(
          new TextEncoder().encode(JSON.stringify(TEST_RESPONSE_OBJ)),
        );

        const actual = await subject.fetchBufferFromApi({
          type: 'rest-buffer',
          method: 'GET',
          path: 'projects/gitlab-org%2fgitlab',
          searchParams: {
            test: 'value',
          },
        });
        const actualByteArray = new Uint8Array(actual);

        expect(fetchSpy).toHaveBeenCalledWith(expectedUrl, {
          headers: TEST_AUTH_TOKEN_HEADERS,
          method: 'GET',
        });
        expect(actualByteArray).toEqual(expectedResponse);
      });
    });
  });
});
