import type { DefaultGitLabClient } from '@gitlab/gitlab-api-client';
import type { fetchBufferFromApi, GetBufferRequest } from '@khulnasoft/web-ide-interop';
import type { VSBufferWrapper } from '../types';

export const commandFactory =
  (client: DefaultGitLabClient, bufferWrapper: VSBufferWrapper): fetchBufferFromApi =>
  async (request: GetBufferRequest) => {
    const buffer = await client.fetchBufferFromApi(request);

    const byteArray = new Uint8Array(buffer);

    return bufferWrapper(byteArray);
  };
