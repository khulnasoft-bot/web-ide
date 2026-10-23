import type { DefaultGitLabClient } from '@gitlab/gitlab-api-client';
import type { ApiRequest, fetchFromApi } from '@gitlab/web-ide-interop';

export const commandFactory =
  (client: DefaultGitLabClient): fetchFromApi =>
  <T>(request: ApiRequest<T>) =>
    client.fetchFromApi(request);
