import type { gitlab, DeprecatedGitLabClient as GitLabClient } from '@khulnasoft/khulnasoft-api-client';
import type { WebIdeExtensionConfig } from '@khulnasoft/web-ide-types';

export const commandFactory =
  (config: WebIdeExtensionConfig, client: GitLabClient) =>
  async (payload: gitlab.CommitPayload): Promise<void> => {
    await client.commit(config.projectPath, payload);
  };
