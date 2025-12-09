import { DefaultAuthProvider } from '@gitlab/gitlab-api-client';
import { createWebIdeExtensionConfig } from '@khulnasoft/utils-test';
import { createCommands } from '@khulnasoft/vscode-mediator-commands';
import { getConfig } from '../config';
import type { SecureMediatorCommandExecutor } from './SecureMediatorCommandExecutor';
import { createSecureMediatorCommandExecutor } from './SecureMediatorCommandExecutor';

jest.mock('@khulnasoft/vscode-mediator-commands');
jest.mock('../config');

const TEST_AUTH_PROVIDER = new DefaultAuthProvider('test-token');
const TEST_CONFIG = createWebIdeExtensionConfig();

describe('mediator/executor/SecureMediatorCommandExecutor', () => {
  let subject: SecureMediatorCommandExecutor;

  beforeEach(async () => {
    jest.mocked(getConfig).mockResolvedValue(TEST_CONFIG);
    jest.mocked(createCommands).mockResolvedValue([
      {
        id: 'foo',
        handler: jest.fn().mockResolvedValue('test-foo'),
      },
      {
        id: 'bar',
        handler: jest.fn().mockResolvedValue('test-bar'),
      },
    ]);

    subject = await createSecureMediatorCommandExecutor(TEST_AUTH_PROVIDER);
  });

  it('calls createCommands', () => {
    expect(createCommands).toHaveBeenCalledTimes(1);
    expect(createCommands).toHaveBeenCalledWith({
      config: TEST_CONFIG,
      auth: TEST_AUTH_PROVIDER,
      bufferWrapper: expect.any(Function),
      skipProtection: true,
    });
  });

  it('bufferWrapper just wraps buffer in object', () => {
    const buffer = new TextEncoder().encode('Hello World');

    const { bufferWrapper } = jest.mocked(createCommands).mock.calls[0][0];

    expect(bufferWrapper(buffer)).toEqual({ buffer });
  });

  describe('execute', () => {
    it('throws if command is not found', async () => {
      await expect(subject.execute('baz')).rejects.toThrowError(
        'Secure mediator command "baz" not found!',
      );
    });

    it('executes command if found', async () => {
      const actual = await subject.execute('foo');

      expect(actual).toEqual('test-foo');
    });
  });
});
