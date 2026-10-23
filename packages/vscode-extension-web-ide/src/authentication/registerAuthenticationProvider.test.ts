import { createWebIdeExtensionConfig, createFakePartial } from '@gitlab/utils-test';
import * as vscode from 'vscode';
import { registerAuthenticationProvider } from './registerAuthenticationProvider';
import { subscribeProviderToChangeMessage } from './subscribeProviderToChangeMessage';

import '../../vscode.proposed.ipc.d';
import { AUTHENTICATION_PROVIDER_ID } from '../constants';
import { GitLabAuthenticationProvider } from './GitLabAuthenticationProvider';
import { WebIdeExtensionTokenProvider } from './WebIdeExtensionTokenProvider';

jest.mock('./subscribeProviderToChangeMessage');

const TEST_CONFIG = createWebIdeExtensionConfig();
const TEST_TOKEN = 'test-123-token';

describe('authentication/registerAuthenticationProvider', () => {
  let context: vscode.ExtensionContext;
  let subject: vscode.Disposable;
  let disposables: vscode.Disposable[];
  let apiAuthProvider: WebIdeExtensionTokenProvider;

  const getAuthProvider = (): GitLabAuthenticationProvider => {
    const authProvider = jest.mocked(vscode.authentication.registerAuthenticationProvider).mock
      .calls[0]?.[2];

    if (authProvider instanceof GitLabAuthenticationProvider) {
      return authProvider;
    }

    throw new Error('Error! Expected authProvider to be GitLabAuthenticationProvider');
  };

  const createDisposable = (): vscode.Disposable => {
    const disposable = {
      dispose: jest.fn(),
    };

    disposables.push(disposable);

    return disposable;
  };

  beforeEach(() => {
    disposables = [];

    context = createFakePartial<vscode.ExtensionContext>({
      secrets: createFakePartial<vscode.SecretStorage>({
        get: jest.fn().mockImplementation(key => {
          if (key === 'auth_token') {
            return Promise.resolve(TEST_TOKEN);
          }

          return Promise.resolve(undefined);
        }),
      }),
    });
    apiAuthProvider = new WebIdeExtensionTokenProvider(context);

    jest.mocked(subscribeProviderToChangeMessage).mockReturnValue(createDisposable());
    jest
      .mocked(vscode.authentication.registerAuthenticationProvider)
      .mockReturnValue(createDisposable());
  });

  describe('default', () => {
    beforeEach(async () => {
      subject = await registerAuthenticationProvider(context, apiAuthProvider, TEST_CONFIG);
    });

    it('calls registerAuthenticationProvider', () => {
      expect(vscode.authentication.registerAuthenticationProvider).toHaveBeenCalledTimes(1);
      expect(vscode.authentication.registerAuthenticationProvider).toHaveBeenCalledWith(
        AUTHENTICATION_PROVIDER_ID,
        'GitLab Web IDE',
        expect.any(GitLabAuthenticationProvider),
        {
          supportsMultipleAccounts: false,
        },
      );
    });

    it('calls subscribeProviderToChangeMessage', () => {
      expect(subscribeProviderToChangeMessage).toHaveBeenCalledTimes(1);
      expect(subscribeProviderToChangeMessage).toHaveBeenCalledWith(
        getAuthProvider(),
        apiAuthProvider,
        context,
      );
    });

    it('creates GitLabAuthenticationProvider with token', async () => {
      const sessions = await getAuthProvider().getSessions();

      expect(sessions).toEqual([expect.objectContaining({ accessToken: TEST_TOKEN })]);
    });

    describe('when disposed', () => {
      beforeEach(() => {
        jest.spyOn(getAuthProvider(), 'dispose').mockImplementation();

        subject.dispose();
      });

      it('disposes everything', () => {
        expect(getAuthProvider().dispose).toHaveBeenCalled();

        expect(disposables).toHaveLength(2);
        disposables.forEach(disposable => {
          expect(disposable.dispose).toHaveBeenCalled();
        });
      });
    });
  });

  describe('when token not available', () => {
    beforeEach(async () => {
      jest.mocked(context.secrets.get).mockResolvedValue(undefined);

      subject = await registerAuthenticationProvider(context, apiAuthProvider, TEST_CONFIG);
    });

    it('registers authentication provider', () => {
      expect(vscode.authentication.registerAuthenticationProvider).toHaveBeenCalledTimes(1);
    });

    it('creates GitLabAuthenticationProvider without token', async () => {
      const sessions = await getAuthProvider().getSessions();

      expect(sessions).toEqual([]);
    });
  });
});
