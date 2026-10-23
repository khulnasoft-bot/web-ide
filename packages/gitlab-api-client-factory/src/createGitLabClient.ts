import { DefaultGitLabClient } from '@gitlab/gitlab-api-client';
import type { AuthProvider } from '@gitlab/gitlab-api-client';
import type { WebIdeConfig } from '@gitlab/web-ide-types';
import { getAuthHeadersProvider } from './getAuthHeadersProvider';

export const createGitLabClient = (
  config: WebIdeConfig,
  auth?: AuthProvider,
): DefaultGitLabClient =>
  new DefaultGitLabClient({
    baseUrl: config.gitlabUrl,
    auth: getAuthHeadersProvider(config.auth?.type, auth),
    httpHeaders: config.httpHeaders,
  });
