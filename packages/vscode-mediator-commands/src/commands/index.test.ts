import {
  DefaultGitLabClient,
  DeprecatedGitLabClient as GitLabClient,
} from '@gitlab/gitlab-api-client';
import {
  COMMAND_FETCH_BUFFER_FROM_API,
  COMMAND_FETCH_FROM_API,
  COMMAND_MEDIATOR_TOKEN,
} from '@khulnasoft/web-ide-interop';
import type { Command, VSBufferWrapper } from '../types';
import {
  COMMAND_COMMIT,
  COMMAND_CREATE_PROJECT_BRANCH,
  COMMAND_FETCH_FILE_RAW,
  COMMAND_FETCH_MERGE_REQUEST_DIFF_STATS,
  COMMAND_FETCH_PROJECT_BRANCHES,
  COMMAND_START,
} from '../constants';
import { createCommands } from './index';
import * as commit from './commit';
import * as start from './start';
import * as fetchFileRaw from './fetchFileRaw';
import { generateUniqueToken } from './utils/generateUniqueToken';
import { TEST_COMMIT_PAYLOAD, TEST_CONFIG } from '../../test-utils';

jest.mock('@gitlab/gitlab-api-client');
jest.mock('./commit');
jest.mock('./start');
jest.mock('./fetchFileRaw');
jest.mock('./utils/generateUniqueToken');

const TEST_BUFFER_WRAPPER: VSBufferWrapper = (buffer: Uint8Array) => ({
  buffer,
});

const TEST_MEDIATOR_TOKEN = 'fake-mediator-token';

describe('vscode-mediator-commands/commands', () => {
  let commitSpy: jest.Mock;
  let startSpy: jest.Mock;
  let fetchFileRawSpy: jest.Mock;
  let commands: Command[] = [];

  const callCommand = (id: string, ...args: unknown[]) => {
    const command = commands.find(x => x.id === id);

    if (!command) {
      return Promise.reject(new Error('TEST_ERROR: Command not found'));
    }

    return (command.handler as (...x: unknown[]) => unknown).call(null, ...args);
  };

  const createCommandSpy = (commandFactoryModule: { commandFactory: unknown }) => {
    const spy = jest.fn();

    (commandFactoryModule.commandFactory as jest.Mock).mockImplementation(
      (...dependencies: unknown[]) =>
        (...args: unknown[]) =>
          spy({
            dependencies,
            args,
          }),
    );

    return spy;
  };

  const getClient = () => jest.mocked(GitLabClient).mock.instances[0];
  const getDefaultClient = () => jest.mocked(jest.mocked(DefaultGitLabClient).mock.instances[0]);

  beforeEach(async () => {
    // createCommandSpy sets up the module mock too, so we have to call this before createCommands
    commitSpy = createCommandSpy(commit);
    startSpy = createCommandSpy(start);
    fetchFileRawSpy = createCommandSpy(fetchFileRaw);

    jest.mocked(generateUniqueToken).mockResolvedValue(TEST_MEDIATOR_TOKEN);

    commands = await createCommands({ config: TEST_CONFIG, bufferWrapper: TEST_BUFFER_WRAPPER });
  });

  describe(COMMAND_START, () => {
    beforeEach(async () => {
      await callCommand(COMMAND_START, TEST_MEDIATOR_TOKEN, 'arg');
    });

    it('triggers start command', () => {
      expect(startSpy).toHaveBeenCalledWith({
        dependencies: [TEST_CONFIG, expect.any(GitLabClient)],
        args: ['arg'],
      });
    });
  });

  describe(COMMAND_FETCH_FILE_RAW, () => {
    beforeEach(async () => {
      await callCommand(COMMAND_FETCH_FILE_RAW, TEST_MEDIATOR_TOKEN, 'ref', 'path');
    });

    it('triggers fetchFileRaw command', () => {
      expect(fetchFileRawSpy).toHaveBeenCalledWith({
        dependencies: [TEST_CONFIG, expect.any(GitLabClient), TEST_BUFFER_WRAPPER],
        args: ['ref', 'path'],
      });
    });
  });

  describe.each<[string, keyof GitLabClient, unknown]>([
    [COMMAND_FETCH_MERGE_REQUEST_DIFF_STATS, 'fetchMergeRequestDiffStats', { mergeRequestId: '7' }],
    [
      COMMAND_FETCH_PROJECT_BRANCHES,
      'fetchProjectBranches',
      { projectPath: 'gitlab-org/gitlab', searchPattern: '*foo*', offset: 0, limit: 100 },
    ],
    [
      COMMAND_CREATE_PROJECT_BRANCH,
      'createProjectBranch',
      { projectPath: 'gitlab-org/gitlab', searchPattern: '*foo*', offset: 0, limit: 100 },
    ],
  ])('%s', (command, clientMethodName, payload) => {
    it('calls client with payload', async () => {
      await callCommand(command, TEST_MEDIATOR_TOKEN, payload);

      expect(getClient()[clientMethodName]).toHaveBeenCalledWith(payload);
    });
  });

  describe(COMMAND_FETCH_FROM_API, () => {
    it('calls client with payload', async () => {
      const payload = { type: 'api', mehthod: 'GET', path: 'test' };
      const expectedReturn = { test: 123 };
      getDefaultClient().fetchFromApi.mockResolvedValue(expectedReturn);

      const actual = await callCommand(COMMAND_FETCH_FROM_API, TEST_MEDIATOR_TOKEN, payload);

      expect(getDefaultClient().fetchFromApi).toHaveBeenCalledWith(payload);
      expect(actual).toBe(expectedReturn);
    });

    it('rejects if called without token', async () => {
      const payload = { type: 'api', mehthod: 'GET', path: 'test' };

      await expect(callCommand(COMMAND_FETCH_FROM_API, payload)).rejects.toThrow('Token invalid');
    });
  });

  describe(COMMAND_FETCH_BUFFER_FROM_API, () => {
    it('calls client with payload', async () => {
      const payload = { type: 'api', mehthod: 'GET', path: 'test' };
      const expectedByteArray = new Uint8Array(new TextEncoder().encode('hello world'));
      getDefaultClient().fetchBufferFromApi.mockResolvedValue(expectedByteArray.buffer);

      const actual = await callCommand(COMMAND_FETCH_BUFFER_FROM_API, TEST_MEDIATOR_TOKEN, payload);

      expect(getDefaultClient().fetchBufferFromApi).toHaveBeenCalledWith(payload);
      expect(actual).toEqual({ buffer: expectedByteArray });
    });
  });

  describe(COMMAND_COMMIT, () => {
    beforeEach(async () => {
      await callCommand(COMMAND_COMMIT, TEST_MEDIATOR_TOKEN, TEST_COMMIT_PAYLOAD);
    });

    it('triggers commit command', () => {
      expect(commitSpy).toHaveBeenCalledWith({
        dependencies: [TEST_CONFIG, expect.any(GitLabClient)],
        args: [TEST_COMMIT_PAYLOAD],
      });
    });
  });

  describe(COMMAND_MEDIATOR_TOKEN, () => {
    it('returns the generated mediator token', async () => {
      expect(callCommand(COMMAND_MEDIATOR_TOKEN)).toEqual(TEST_MEDIATOR_TOKEN);
    });
  });

  describe('with skipProtection', () => {
    beforeEach(async () => {
      commands = await createCommands({
        config: TEST_CONFIG,
        bufferWrapper: TEST_BUFFER_WRAPPER,
        skipProtection: true,
      });
    });

    it('does not create mediator token command', async () => {
      await expect(() => callCommand(COMMAND_MEDIATOR_TOKEN)).rejects.toThrowError(
        'TEST_ERROR: Command not found',
      );
    });

    it('does not protect commands with token', async () => {
      await callCommand(COMMAND_START, 'arg');

      expect(startSpy).toHaveBeenCalledWith({
        dependencies: [TEST_CONFIG, expect.any(GitLabClient)],
        args: ['arg'],
      });
    });
  });
});
