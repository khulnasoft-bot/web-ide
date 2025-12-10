import { DefaultGitLabClient } from '@khulnasoft/khulnasoft-api-client';
import type { AuthProvider } from '@khulnasoft/khulnasoft-api-client';
import type { WebIdeConfig } from '@khulnasoft/web-ide-types';
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
