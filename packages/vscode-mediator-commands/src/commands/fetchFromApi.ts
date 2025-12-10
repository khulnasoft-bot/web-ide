import type { DefaultGitLabClient } from '@khulnasoft/khulnasoft-api-client';
import type { ApiRequest, fetchFromApi } from '@khulnasoft/web-ide-interop';

export const commandFactory =
  (client: DefaultGitLabClient): fetchFromApi =>
  <T>(request: ApiRequest<T>) =>
    client.fetchFromApi(request);
