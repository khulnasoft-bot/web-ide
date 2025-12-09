import type { AuthProvider } from '@gitlab/gitlab-api-client';
import { WEB_IDE_EXTENSION_ID } from '@khulnasoft/web-ide-interop';
import type { WebIdeExtensionConfig } from '@khulnasoft/web-ide-types';
import { DEFAULT_SESSION_ID } from '../../constant';
import type { AuthenticationSessionInfo, ISecretStorageProvider } from '../types';
import { InMemorySecretStorageProvider } from './InMemorySecretStorageProvider';
import { OverlaySecretStorageProvider } from './OverlaySecretStorageProvider';
import type { SecretStorageEntry } from './ReadonlySecretStorageProvider';
import { ReadonlySecretStorageProvider } from './ReadonlySecretStorageProvider';

const createExtensionSecretKey = (extensionId: string, key: string) =>
  JSON.stringify({ extensionId, key });

// what: This khulnasoft-web-ide corresponds to the `authenticationProvider` of the `settingsSync` options
//       passed to the Workbench construction options.
const EXPECTED_LOGIN_ACCOUNT_KEY = 'khulnasoft-web-ide.loginAccount';
const EXPECTED_AUTH_TOKEN_KEY = createExtensionSecretKey(WEB_IDE_EXTENSION_ID, 'auth_token');
const EXPECTED_CONFIG_KEY = createExtensionSecretKey(WEB_IDE_EXTENSION_ID, 'config');

const isLoginAccountKey = (key: string) => key === EXPECTED_LOGIN_ACCOUNT_KEY;
const isAuthTokenKey = (key: string) => key === EXPECTED_AUTH_TOKEN_KEY;
const isConfigKey = (key: string) => key === EXPECTED_CONFIG_KEY;

const createLoginAccount = (accessToken: string): AuthenticationSessionInfo => ({
  id: DEFAULT_SESSION_ID,
  accessToken,
  providerId: 'khulnasoft-web-ide',
  canSignOut: false,
});

interface Options {
  readonly config: WebIdeExtensionConfig;
  readonly authProvider?: AuthProvider;
}

export const createDefaultSecretStorageProvider = ({
  config,
  authProvider,
}: Options): ISecretStorageProvider => {
  const configAsJson = Promise.resolve(JSON.stringify(config));
  const secretStorageValues: SecretStorageEntry[] = [[isConfigKey, () => configAsJson]];

  if (authProvider) {
    const getAuthToken = () => authProvider.getToken();
    const getLoginAccount = async () => {
      const token = await authProvider.getToken();

      return JSON.stringify(createLoginAccount(token));
    };

    secretStorageValues.push([isAuthTokenKey, getAuthToken], [isLoginAccountKey, getLoginAccount]);
  }

  const readonlyProvider = new ReadonlySecretStorageProvider(secretStorageValues);
  const writableProvider = new InMemorySecretStorageProvider();

  return new OverlaySecretStorageProvider(readonlyProvider, writableProvider);
};
