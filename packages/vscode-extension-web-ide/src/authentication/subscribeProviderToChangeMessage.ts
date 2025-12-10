import type { AuthProvider as ApiAuthProvider } from '@khulnasoft/khulnasoft-api-client';
import type * as vscode from 'vscode';
import { NOOP_DISPOSABLE } from '../utils';
import type { GitLabAuthenticationProvider } from './GitLabAuthenticationProvider';

export const WEBIDE_AUTH_CHANGE_MESSAGE = 'webide_auth_change';

export const subscribeProviderToChangeMessage = (
  vscodeAuthProvider: GitLabAuthenticationProvider,
  apiAuthProvider: ApiAuthProvider,
  context: vscode.ExtensionContext,
) => {
  if (!context.messagePassingProtocol) {
    return NOOP_DISPOSABLE;
  }

  return context.messagePassingProtocol.onDidReceiveMessage(async e => {
    if (e === WEBIDE_AUTH_CHANGE_MESSAGE) {
      const token = await apiAuthProvider.getToken();

      if (!token) {
        return;
      }

      vscodeAuthProvider.updateToken(token);
    }
  });
};
