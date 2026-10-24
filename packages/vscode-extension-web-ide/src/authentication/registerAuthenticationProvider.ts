import type { WebIdeExtensionConfig } from '@khulnasoft/web-ide-types';
import type { AuthProvider as ApiAuthProvider } from '@gitlab/gitlab-api-client';
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
      // TODO: Use name from GitLab instance instead of 'GitLab Web IDE'
      'GitLab Web IDE',
      vscodeAuthProvider,
      {
        supportsMultipleAccounts: false,
      },
    ),
  );
}
