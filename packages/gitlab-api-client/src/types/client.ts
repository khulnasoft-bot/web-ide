import type {
  GetRequest,
  PostRequest,
  DeleteRequest,
  GetBufferRequest,
} from '@khulnasoft/web-ide-interop';

export type EndpointMethod =
  | GetRequest<unknown>['method']
  | PostRequest<unknown>['method']
  | DeleteRequest<unknown>['method'];
export type PathParams = Record<string, string>;
export type DefaultPathParams = Record<string, never>;
export type DefaultBodyParams = never;
export type DefaultReturnType = unknown;

export interface AuthProvider {
  getToken(): Promise<string>;
}

export interface AuthHeadersProvider {
  getHeaders(): Promise<Record<string, string>>;
}

export interface ResponseErrorBody {
  status: number;
  body?: unknown;
}

export interface GetEndpoint<TReturnType, TPathParams> {
  createRequest(params: TPathParams): GetRequest<TReturnType>;
}

export interface GetBufferEndpoint<TPathParams> {
  createRequest(params: TPathParams): GetBufferRequest;
}

export interface PostEndpoint<TReturnType, TPathParams, TBodyParams> {
  createRequest(
    pathParams: TPathParams,
    bodyParams: TBodyParams,
    headers?: Record<string, string>,
  ): PostRequest<TReturnType>;
}

export interface DeleteEndpoint<TReturnType, TPathParams> {
  createRequest(params: TPathParams, headers?: Record<string, string>): DeleteRequest<TReturnType>;
}
