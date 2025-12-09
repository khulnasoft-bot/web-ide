import type { AuthProvider } from '@gitlab/gitlab-api-client';
import { useFakeBroadcastChannel } from '@khulnasoft/utils-test';
import { createOAuthClient } from './createOAuthClient';
import type { OAuthTokenState } from './types';
import { asOAuthProvider } from './asOAuthProvider';

const TEST_TOKEN: OAuthTokenState = {
  accessToken: 'test-access-token',
  expiresAt: 0,
};

describe('asOAuthProvider', () => {
  useFakeBroadcastChannel();

  let subject: AuthProvider;

  beforeEach(() => {
    const client = createOAuthClient({
      oauthConfig: {
        type: 'oauth',
        callbackUrl: 'https://example.com/oauth_callback',
        clientId: 'ABC123-456DEF',
      },
      gitlabUrl: 'https://gdk.test:3443',
    });
    jest.spyOn(client, 'getToken').mockResolvedValue(TEST_TOKEN);

    subject = asOAuthProvider(client);
  });

  it('getToken - returns token', async () => {
    const actual = await subject.getToken();

    expect(actual).toEqual(TEST_TOKEN.accessToken);
  });
});
