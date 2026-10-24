import { GraphQLClient } from 'graphql-request';
import { joinPaths } from '@khulnasoft/utils-path';
import type {
  ApiRequest,
  DeleteRequest,
  GetBufferRequest,
  GetRequest,
  GraphQLRequest,
  PostRequest,
} from '@khulnasoft/web-ide-interop';
import { NOOP_AUTH_HEADERS_PROVIDER } from './createHeadersProvider';
import { createResponseError } from './createResponseError';
import type { AuthHeadersProvider } from './types';

const withParams = (baseUrl: string, params: Record<string, string>) => {
  const paramEntries = Object.entries(params);

  if (!paramEntries.length) {
    return baseUrl;
  }

  const url = new URL(baseUrl);

  paramEntries.forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  return url.toString();
};

export interface DefaultGitLabConfig {
  baseUrl: string;
  auth?: AuthHeadersProvider;
  httpHeaders?: Record<string, string>;
}

export class DefaultGitLabClient {
  readonly #baseUrl: string;

  readonly #httpHeaders: Record<string, string>;

  readonly #auth: AuthHeadersProvider;

  readonly #graphqlClient: GraphQLClient;

  constructor(config: DefaultGitLabConfig) {
    this.#baseUrl = config.baseUrl;
    this.#httpHeaders = config.httpHeaders || {};
    this.#auth = config.auth || NOOP_AUTH_HEADERS_PROVIDER;

    const graphqlUrl = joinPaths(this.#baseUrl, 'api', 'graphql');
    this.#graphqlClient = new GraphQLClient(graphqlUrl);
  }

  async fetchBufferFromApi(request: GetBufferRequest): Promise<ArrayBuffer> {
    return this.#makeGetBufferRequest(request);
  }

  async fetchFromApi<T>(request: ApiRequest<T>): Promise<T> {
    if (request.type === 'rest' && request.method === 'GET') {
      return this.#makeGetRequest(request);
    }
    if (request.type === 'rest' && request.method === 'POST') {
      return this.#makePostRequest(request);
    }
    if (request.type === 'rest' && request.method === 'DELETE') {
      return this.#makeDeleteRequest(request);
    }
    if (request.type === 'graphql') {
      return this.#makeGraphQLRequest(request);
    }
    throw new Error(`Unknown request type: ${(request as ApiRequest<T>).type}`);
  }

  async #makeDeleteRequest<T>(request: DeleteRequest<T>): Promise<T> {
    const url = this.#appendPathToBaseApiUrl(request.path);
    return this.#fetchDeleteJson(url, request.headers);
  }

  async #makePostRequest<T>(request: PostRequest<T>): Promise<T> {
    const url = this.#appendPathToBaseApiUrl(request.path);
    return this.#fetchPostJson(url, request.body, request.headers);
  }

  async #makeGetRequest<T>(request: GetRequest<T>): Promise<T> {
    const url = this.#appendPathToBaseApiUrl(request.path);

    return this.#fetchGetJson(url, request.searchParams, request.headers);
  }

  async #makeGetBufferRequest(request: GetBufferRequest): Promise<ArrayBuffer> {
    const url = this.#appendPathToBaseApiUrl(request.path);

    return this.#fetchGetBuffer(url, request.searchParams, request.headers);
  }

  #appendPathToBaseApiUrl(path: string) {
    return joinPaths(this.#baseUrl, 'api', 'v4', path);
  }

  async #fetchPostJson<TResponse, TBody>(
    url: string,
    body: TBody,
    headers?: Record<string, string>,
  ): Promise<TResponse> {
    const commonHeaders = await this.#getCommonHeaders();

    const response = await fetch(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        ...commonHeaders,
        ...headers,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw await createResponseError(response);
    }

    return <Promise<TResponse>>response.json();
  }

  async #fetchDeleteJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const commonHeaders = await this.#getCommonHeaders();

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...commonHeaders,
        ...headers,
      },
    });

    if (!response.ok) {
      throw await createResponseError(response);
    }

    // Some DELETE endpoints return empty response (204 No Content)
    // In that case, return empty object as T
    if (
      response.status === 204 ||
      !response.headers.get('content-type')?.includes('application/json')
    ) {
      return {} as T;
    }

    return <Promise<T>>response.json();
  }

  async #fetchGetJson<T>(
    url: string,
    params: Record<string, string> = {},
    headers: Record<string, string> = {},
  ): Promise<T> {
    const response = await this.#fetchGetResponse(url, params, headers);

    return (await response.json()) as T;
  }

  async #fetchGetBuffer(
    url: string,
    params: Record<string, string> = {},
    headers: Record<string, string> = {},
  ): Promise<ArrayBuffer> {
    const response = await this.#fetchGetResponse(url, params, headers);

    return response.arrayBuffer();
  }

  async #fetchGetResponse(
    url: string,
    params: Record<string, string> = {},
    headers: Record<string, string> = {},
  ): Promise<Response> {
    const commonHeaders = await this.#getCommonHeaders();

    const response = await fetch(withParams(url, params), {
      method: 'GET',
      headers: {
        ...commonHeaders,
        ...headers,
      },
    });

    if (!response.ok) {
      throw await createResponseError(response);
    }

    return response;
  }

  async #makeGraphQLRequest<T>(request: GraphQLRequest<T>): Promise<T> {
    const commonHeaders = await this.#getCommonHeaders();

    return this.#graphqlClient.request(request.query, request.variables, commonHeaders);
  }

  async #getCommonHeaders(): Promise<Record<string, string>> {
    const authHeaders = await this.#auth.getHeaders();

    return {
      ...this.#httpHeaders,
      ...authHeaders,
    };
  }
}
