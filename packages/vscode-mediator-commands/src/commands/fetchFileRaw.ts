import type { DeprecatedGitLabClient as GitLabClient } from '@khulnasoft/khulnasoft-api-client';
import type { WebIdeExtensionConfig } from '@khulnasoft/web-ide-types';
import type { VSBufferWrapper, VSCodeBuffer } from '../types';

type FetchFileRawCommand = (ref: string, path: string) => Promise<VSCodeBuffer>;

export const commandFactory =
  (
    config: WebIdeExtensionConfig,
    client: GitLabClient,
    bufferWrapper: VSBufferWrapper,
  ): FetchFileRawCommand =>
  async (ref, path) => {
    const buffer = await client.fetchFileRaw(config.projectPath, ref, path);

    const byteArr = new Uint8Array(buffer);

    return bufferWrapper(byteArr);
  };
