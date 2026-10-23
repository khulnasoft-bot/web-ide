import { createConsoleLogger, type Logger } from '@gitlab/logger';
import type { OAuthConfig } from '@gitlab/web-ide-types';
import { joinPaths } from '@gitlab/utils-path';
import type { OAuthClient } from './OAuthClient';
import type { OAuthTokenState } from './types';
import { DefaultOAuthStateBroadcaster } from './DefaultOAuthStateBroadcaster';
import { DefaultOAuthClient } from './OAuthClient';
import { OAuthLocalStorage } from './OAuthLocalStorage';

interface CreateOAuthClientOptions {
  readonly oauthConfig: OAuthConfig;
  readonly gitlabUrl: string;
  readonly owner?: string;
  readonly logger?: Logger;
}

export const createOAuthClient = ({
  oauthConfig,
  gitlabUrl,
  owner,
  // TODO: We should make sure we're passing a relevant logger down whenever we createOAuthClient
  logger = createConsoleLogger(),
}: CreateOAuthClientOptions): OAuthClient => {
  const excludeKeys: (keyof OAuthTokenState)[] = [];
  if (oauthConfig.protectRefreshToken) {
    excludeKeys.push('refreshToken');
  }

  const storage = new OAuthLocalStorage({ excludeKeys, logger });
  const broadcaster = new DefaultOAuthStateBroadcaster();

  return new DefaultOAuthClient({
    app: {
      clientId: oauthConfig.clientId,
      callbackUrl: oauthConfig.callbackUrl,
      authorizeUrl: joinPaths(gitlabUrl, 'oauth/authorize'),
      tokenUrl: joinPaths(gitlabUrl, 'oauth/token'),
    },
    storage,
    broadcaster,
    owner,
    tokenLifetime: oauthConfig.tokenLifetime,
  });
};
