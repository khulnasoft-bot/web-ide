import type { WebIdeExtensionConfig } from '@khulnasoft/web-ide-types';
import type { AuthProvider as ApiAuthProvider } from '@khulnasoft/khulnasoft-api-client';
import * as vscode from 'vscode';
import { AUTHENTICATION_PROVIDER_ID } from '../constants';
import { log } from '../utils';
import { subscribeProviderToChangeMessage } from './subscribeProviderToChangeMessage';
import { GitLabAuthenticationProvider } from './GitLabAuthenticationProvider';

export async function registerAuthenticationProvider(
  context: vscode.ExtensionContext,
  apiAuthProvider: ApiAuthProvider,
  config: WebIdeExtensionConfig,
) {
  const token = await apiAuthProvider.getToken();

  if (!token) {
    log.debug('OAuth token not found.');
  }

  log.debug('Registering authentication provider...');

  const vscodeAuthProvider = new GitLabAuthenticationProvider(config, token);

  return vscode.Disposable.from(
    vscodeAuthProvider,
    subscribeProviderToChangeMessage(vscodeAuthProvider, apiAuthProvider, context),
    vscode.authentication.registerAuthenticationProvider(
      AUTHENTICATION_PROVIDER_ID,
      // TODO: Use name from KhulnaSoft instance instead of 'KhulnaSoft Web IDE'
      'KhulnaSoft Web IDE',
      vscodeAuthProvider,
      {
        supportsMultipleAccounts: false,
      },
    ),
  );
}
