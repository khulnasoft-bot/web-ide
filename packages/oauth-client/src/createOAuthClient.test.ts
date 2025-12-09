import type { OAuthConfig } from '@khulnasoft/web-ide-types';
import { useFakeBroadcastChannel } from '@khulnasoft/utils-test';
import { Logger } from '@gitlab/logger';
import { DefaultOAuthClient } from './OAuthClient';
import { createOAuthClient } from './createOAuthClient';
import { DefaultOAuthStateBroadcaster } from './DefaultOAuthStateBroadcaster';
import { OAuthLocalStorage } from './OAuthLocalStorage';

jest.mock('./OAuthLocalStorage');
jest.mock('./OAuthClient');

const TEST_OWNER = 'root';
const TEST_OAUTH_CONFIG: OAuthConfig = {
  callbackUrl: 'https://example.com/oauth_callback',
  clientId: '123456',
  type: 'oauth',
  protectRefreshToken: false,
};
const TEST_GITLAB_URL = 'https://gdk.test:3443/gitlab';

describe('createOAuthClient', () => {
  useFakeBroadcastChannel();

  it('creates OAuthClient', () => {
    expect(DefaultOAuthClient).not.toHaveBeenCalled();

    const client = createOAuthClient({
      oauthConfig: TEST_OAUTH_CONFIG,
      owner: TEST_OWNER,
      gitlabUrl: TEST_GITLAB_URL,
    });

    expect(client).toBeInstanceOf(DefaultOAuthClient);
    expect(DefaultOAuthClient).toHaveBeenCalledTimes(1);
    expect(DefaultOAuthClient).toHaveBeenCalledWith({
      app: {
        clientId: TEST_OAUTH_CONFIG.clientId,
        callbackUrl: TEST_OAUTH_CONFIG.callbackUrl,
        authorizeUrl: 'https://gdk.test:3443/gitlab/oauth/authorize',
        tokenUrl: 'https://gdk.test:3443/gitlab/oauth/token',
      },
      owner: TEST_OWNER,
      broadcaster: expect.any(DefaultOAuthStateBroadcaster),
      storage: expect.any(OAuthLocalStorage),
    });
  });

  it.each`
    auth                              | excludeKeys
    ${{ protectRefreshToken: false }} | ${[]}
    ${{ protectRefreshToken: true }}  | ${['refreshToken']}
  `('with $auth, initializes storage with excludeKeys=$excludeKeys', ({ auth, excludeKeys }) => {
    expect(OAuthLocalStorage).not.toHaveBeenCalled();

    createOAuthClient({
      oauthConfig: { ...TEST_OAUTH_CONFIG, ...auth },
      owner: TEST_OWNER,
      gitlabUrl: TEST_GITLAB_URL,
    });

    expect(OAuthLocalStorage).toHaveBeenCalledTimes(1);
    expect(OAuthLocalStorage).toHaveBeenCalledWith({ excludeKeys, logger: expect.any(Logger) });
  });
});
