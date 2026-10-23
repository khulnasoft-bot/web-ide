import type * as vscode from 'vscode';
import { createFakePartial } from '@gitlab/utils-test';
import type { GitLabAuthenticationProvider } from './GitLabAuthenticationProvider';
import {
  subscribeProviderToChangeMessage,
  WEBIDE_AUTH_CHANGE_MESSAGE,
} from './subscribeProviderToChangeMessage';
import { NOOP_DISPOSABLE } from '../utils';

import '../../vscode.proposed.ipc.d';
import { WebIdeExtensionTokenProvider } from './WebIdeExtensionTokenProvider';

const TEST_TOKEN = 'test-token-123';

describe('authentication/subscribeProviderToChangeMessage', () => {
  let extensionContext: vscode.ExtensionContext;
  let authProvider: GitLabAuthenticationProvider;
  let apiAuthProvider: WebIdeExtensionTokenProvider;

  const getMessageListener = (): ((e: unknown) => unknown) => {
    const messageListener = jest.mocked(
      extensionContext.messagePassingProtocol?.onDidReceiveMessage,
    )?.mock.calls[0][0];

    if (!messageListener) {
      throw new Error('Expected messagePassingProtocol.onDidReceiveMessage to have been called');
    }

    return messageListener;
  };

  const createExtensionContext = (partial: Partial<vscode.ExtensionContext>) =>
    createFakePartial<vscode.ExtensionContext>({
      ...partial,
      secrets: createFakePartial<vscode.SecretStorage>({
        get: jest.fn().mockResolvedValue(TEST_TOKEN),
      }),
    });

  beforeEach(() => {
    extensionContext = createExtensionContext({});
    authProvider = createFakePartial<GitLabAuthenticationProvider>({
      updateToken: jest.fn(),
    });
    apiAuthProvider = new WebIdeExtensionTokenProvider(extensionContext);
  });

  describe('without messagePassingProtocol', () => {
    it('returns NOOP_DISPOSABLE', () => {
      const disposable = subscribeProviderToChangeMessage(
        authProvider,
        apiAuthProvider,
        extensionContext,
      );

      expect(disposable).toBe(NOOP_DISPOSABLE);
    });
  });

  describe('with messagePassingProtocol', () => {
    beforeEach(() => {
      Object.assign(extensionContext, {
        messagePassingProtocol: {
          onDidReceiveMessage: jest.fn(),
          postMessage: jest.fn(),
        },
      });

      subscribeProviderToChangeMessage(authProvider, apiAuthProvider, extensionContext);
    });

    it('when webide_auth_change message is received, calls updateToken', async () => {
      const messageListener = getMessageListener();

      expect(authProvider.updateToken).not.toHaveBeenCalled();

      await messageListener(WEBIDE_AUTH_CHANGE_MESSAGE);

      expect(authProvider.updateToken).toHaveBeenCalledTimes(1);
      expect(authProvider.updateToken).toHaveBeenCalledWith(TEST_TOKEN);
    });

    it('when another message is received, it does nothing', async () => {
      const messageListener = getMessageListener();

      await messageListener('something_else');

      expect(authProvider.updateToken).not.toHaveBeenCalled();
    });

    it('when auth token cannot be found, it does nothing', async () => {
      const messageListener = getMessageListener();

      jest.mocked(extensionContext.secrets.get).mockResolvedValue(undefined);

      await messageListener(WEBIDE_AUTH_CHANGE_MESSAGE);

      expect(authProvider.updateToken).not.toHaveBeenCalled();
    });
  });
});
