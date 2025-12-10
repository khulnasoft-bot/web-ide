import type { DeprecatedGitLabClient as GitLabClient } from '@khulnasoft/khulnasoft-api-client';
import { createTestClient, TEST_COMMIT_PAYLOAD, TEST_CONFIG } from '../../test-utils';
import * as commit from './commit';

jest.mock('@khulnasoft/khulnasoft-api-client');

describe('vscode-mediator-commands/commands/commit', () => {
  let client: jest.Mocked<GitLabClient>;
  let command: ReturnType<typeof commit.commandFactory>;

  beforeEach(() => {
    client = createTestClient() as jest.Mocked<GitLabClient>;
    command = commit.commandFactory(TEST_CONFIG, client);
  });

  it('calls client.commit when triggered', async () => {
    await command(TEST_COMMIT_PAYLOAD);

    expect(client.commit).toHaveBeenCalledWith(TEST_CONFIG.projectPath, TEST_COMMIT_PAYLOAD);
  });
});
