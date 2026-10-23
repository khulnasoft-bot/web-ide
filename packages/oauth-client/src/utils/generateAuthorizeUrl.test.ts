import type { OAuthApp } from '../types';
import { generateAuthorizeUrl } from './generateAuthorizeUrl';

import '@gitlab/utils-test/src/jsdom.d';
import { sha256ForUrl } from './sha256ForUrl';

const TEST_ORIGINAL_URL = 'https://example.com/original/url';
const TEST_APP: OAuthApp = {
  authorizeUrl: 'https://gdk.test:3443/-/oauth/authorize',
  callbackUrl: 'https://localhost:8000/oauth_callback.html',
  clientId: 'AB123-456DE',
  tokenUrl: 'https://gdk.test:3443/-/oauth/token',
};
const TEST_NANOID = '32-0123456789abcdef';

describe('generateAuthorizeUrl', () => {
  dom.reconfigure({ url: TEST_ORIGINAL_URL });

  it('generates authorize URL', async () => {
    const result = generateAuthorizeUrl(TEST_APP);

    const codeChallenge = sha256ForUrl(TEST_NANOID);

    const expectedUrl = new URL(TEST_APP.authorizeUrl);
    expectedUrl.searchParams.set('client_id', TEST_APP.clientId);
    expectedUrl.searchParams.set('redirect_uri', TEST_APP.callbackUrl);
    expectedUrl.searchParams.set('response_type', 'code');
    expectedUrl.searchParams.set('scope', 'api');
    expectedUrl.searchParams.set('state', TEST_NANOID);
    expectedUrl.searchParams.set('code_challenge', codeChallenge);
    expectedUrl.searchParams.set('code_challenge_method', 'S256');

    await expect(result).resolves.toEqual({
      url: expectedUrl.href,
      handshakeState: {
        state: TEST_NANOID,
        codeVerifier: TEST_NANOID,
        originalUrl: TEST_ORIGINAL_URL,
      },
    });
  });
});
