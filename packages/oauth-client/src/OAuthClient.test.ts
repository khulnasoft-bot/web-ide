import { useFakeLocation } from '@gitlab/utils-test';
import { InMemoryOAuthStorage } from '../test-utils/InMemoryOAuthStorage';
import { DefaultOAuthClient } from './OAuthClient';
import type {
  OAuthApp,
  OAuthStorage,
  OAuthTokenState,
  OAuthHandshakeState,
  OAuthStateBroadcaster,
} from './types';
import {
  authorizeGrantWithIframe,
  BUFFER_MIN,
  generateAuthorizeUrl,
  isCallbackFromIframe,
  notifyParentFromIframe,
} from './utils';
import { createBroadcasterStub } from '../test-utils';

import 'whatwg-fetch';
import '@gitlab/utils-test/src/jsdom.d';

jest.mock('./utils/iframeAuth');

const TEST_TIME = new Date('2023-10-10T00:00:00Z');
const TEST_TOKEN_KEY = 'gitlab/web-ide/oauth/client_id/token';
const TEST_HANDSHAKE_KEY = 'gitlab/web-ide/oauth/client_id/handshake';
const TEST_OWNER = 'root';
const TEST_TOKEN_LIFETIME = 1000;
const TEST_APP: OAuthApp = {
  authorizeUrl: 'https://example.com/oauth/authorize',
  callbackUrl: 'https://example.com/-/ide/callback',
  clientId: 'client_id',
  tokenUrl: 'token_url',
};
const TEST_TOKEN_RESPONSE = {
  access_token: 'test-new-access-token',
  refresh_token: 'test-new-refresh-token',
  expires_in: 72000,
  created_at: TEST_TIME.getTime() / 1000,
};
const TEST_TOKEN_NEW = {
  accessToken: TEST_TOKEN_RESPONSE.access_token,
  refreshToken: TEST_TOKEN_RESPONSE.refresh_token,
  expiresAt: TEST_TIME.getTime() + TEST_TOKEN_RESPONSE.expires_in * 1000,
  owner: undefined,
};
const TEST_TOKEN: OAuthTokenState = {
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  expiresAt: TEST_TIME.getTime() + 10 * 60 * 1000,
};

describe('OAuthClient', () => {
  jest.useFakeTimers().setSystemTime(TEST_TIME);

  let broadcaster: OAuthStateBroadcaster;
  let fetchSpy: jest.SpiedFunction<typeof fetch>;
  let storage: OAuthStorage;
  let subject: DefaultOAuthClient;
  let testHandshakeState: OAuthHandshakeState;
  let testAuthroizeUrl: string;

  const toParamsString = (obj: Record<string, string>) => {
    const params = new URLSearchParams(obj);

    return params.toString();
  };

  const setupForHandleCallback = () => {
    beforeEach(() => {
      // the URL should be a callback url
      const url = new URL(TEST_APP.callbackUrl);

      url.searchParams.set('code', 'test-code');
      url.searchParams.set('state', testHandshakeState.state);

      dom.reconfigure({ url: url.href });
    });

    // NB: fake location has to be set up after dom.reconfigure
    useFakeLocation();
  };

  beforeEach(async () => {
    dom.reconfigure({ url: 'http://localhost' });

    fetchSpy = jest.spyOn(window, 'fetch');
    fetchSpy.mockResolvedValue(new Response(JSON.stringify(TEST_TOKEN_RESPONSE)));

    storage = new InMemoryOAuthStorage();

    ({ url: testAuthroizeUrl, handshakeState: testHandshakeState } =
      await generateAuthorizeUrl(TEST_APP));

    broadcaster = createBroadcasterStub();
  });

  describe('default', () => {
    beforeEach(() => {
      subject = new DefaultOAuthClient({
        app: TEST_APP,
        storage,
        broadcaster,
      });
    });

    describe('getToken', () => {
      it('throws when no token is found', async () => {
        await expect(subject.getToken()).rejects.toThrowError(/No token/);
      });

      describe('with token', () => {
        beforeEach(async () => {
          await storage.set(TEST_TOKEN_KEY, TEST_TOKEN);
        });

        it('returns token', async () => {
          const result = await subject.getToken();

          expect(result).toEqual(TEST_TOKEN);
        });

        it('does not trigger callback', async () => {
          const callback = jest.fn();
          subject.onTokenChange(callback);

          await subject.getToken();

          expect(callback).not.toHaveBeenCalled();
        });
      });

      describe('with expired token and refresh token', () => {
        beforeEach(async () => {
          await storage.set(TEST_TOKEN_KEY, {
            ...TEST_TOKEN,
            expiresAt: TEST_TIME.getTime(),
          });
        });

        it('refreshes token', async () => {
          expect(fetchSpy).not.toHaveBeenCalled();

          await subject.getToken();

          expect(fetchSpy).toHaveBeenCalledTimes(1);
          expect(fetchSpy).toHaveBeenCalledWith(TEST_APP.tokenUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: toParamsString({
              client_id: TEST_APP.clientId,
              redirect_uri: TEST_APP.callbackUrl,
              grant_type: 'refresh_token',
              refresh_token: TEST_TOKEN.refreshToken || '',
            }),
          });
        });

        it('returns and stores token', async () => {
          const result = await subject.getToken();
          const storedResult = await storage.get(TEST_TOKEN_KEY);

          expect(result).toEqual(TEST_TOKEN_NEW);
          expect(storedResult).toEqual(TEST_TOKEN_NEW);
        });

        it('notifies broadcast', async () => {
          expect(broadcaster.notifyTokenChange).not.toHaveBeenCalled();

          await subject.getToken();

          expect(broadcaster.notifyTokenChange).toHaveBeenCalled();
        });

        it('triggers onTokenChange callback', async () => {
          const callback = jest.fn();
          subject.onTokenChange(callback);

          await subject.getToken();

          expect(callback).toHaveBeenCalledTimes(1);
        });

        it('when onTokenChange callback disposed, does not trigger callback', async () => {
          const callback = jest.fn();
          const dispose = subject.onTokenChange(callback);

          dispose();
          await subject.getToken();

          expect(callback).not.toHaveBeenCalled();
        });

        it('throws if response is not ok', async () => {
          fetchSpy.mockResolvedValue(
            new Response(JSON.stringify({ error: 'test-error' }), { status: 400 }),
          );

          await expect(subject.getToken()).rejects.toThrow(
            /Something bad happened while getting OAuth token: {"error":"test-error"}/,
          );
        });
      });

      describe('with expired token and no refresh token', () => {
        beforeEach(async () => {
          await storage.set(TEST_TOKEN_KEY, {
            ...TEST_TOKEN,
            expiresAt: TEST_TIME.getTime(),
            refreshToken: '',
          });

          jest.mocked(authorizeGrantWithIframe).mockResolvedValue({
            grant_type: 'authorization_code',
            code: 'test-code-from-iframe',
            code_verifier: 'test-code-verifier',
          });
        });

        it('refreshes token with grant from iframe', async () => {
          expect(fetchSpy).not.toHaveBeenCalled();
          expect(authorizeGrantWithIframe).not.toHaveBeenCalled();

          await subject.getToken();

          expect(authorizeGrantWithIframe).toHaveBeenCalledTimes(1);
          expect(fetchSpy).toHaveBeenCalledTimes(1);
          expect(fetchSpy).toHaveBeenCalledWith(TEST_APP.tokenUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: toParamsString({
              client_id: TEST_APP.clientId,
              redirect_uri: TEST_APP.callbackUrl,
              grant_type: 'authorization_code',
              code: 'test-code-from-iframe',
              code_verifier: 'test-code-verifier',
            }),
          });
        });
      });

      describe('with invalid token', () => {
        beforeEach(async () => {
          await storage.set(TEST_TOKEN_KEY, {
            ...TEST_TOKEN,
            accessToken: '',
          });
        });

        it('returns and stores token', async () => {
          const result = await subject.getToken();
          const storedResult = await storage.get(TEST_TOKEN_KEY);

          expect(result).toEqual(TEST_TOKEN_NEW);
          expect(storedResult).toEqual(TEST_TOKEN_NEW);
        });
      });
    });

    describe('checkForValidToken', () => {
      it.each`
        token                                 | expectation
        ${null}                               | ${false}
        ${{}}                                 | ${false}
        ${{ ...TEST_TOKEN, accessToken: '' }} | ${false}
        ${TEST_TOKEN}                         | ${true}
      `('with token=$token, should return $expectation', async ({ token, expectation }) => {
        await storage.set(TEST_TOKEN_KEY, token);
        const result = await subject.checkForValidToken();

        expect(result).toBe(expectation);
      });
    });

    describe('handleCallback', () => {
      setupForHandleCallback();

      it('at first, nothing is fetched or stored', async () => {
        // base case used to strengthen the upcoming assertions
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(await storage.get(TEST_TOKEN_KEY)).toBeNull();
        expect(notifyParentFromIframe).not.toHaveBeenCalled();
      });

      describe('without handshake state set', () => {
        it('throws error', async () => {
          await expect(subject.handleCallback()).rejects.toThrow(/handshake state not found/);
        });
      });

      describe('with handshake state set', () => {
        beforeEach(async () => {
          await storage.set(TEST_HANDSHAKE_KEY, testHandshakeState);

          await subject.handleCallback();
        });

        it('requests new token', async () => {
          expect(fetchSpy).toHaveBeenCalledTimes(1);
          expect(fetchSpy).toHaveBeenCalledWith(TEST_APP.tokenUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: toParamsString({
              client_id: TEST_APP.clientId,
              redirect_uri: TEST_APP.callbackUrl,
              grant_type: 'authorization_code',
              code: 'test-code',
              code_verifier: '32-0123456789abcdef',
            }),
          });
        });

        it('stores new token', async () => {
          expect(await storage.get(TEST_TOKEN_KEY)).toEqual(TEST_TOKEN_NEW);
        });

        it('deletes handshake state', async () => {
          expect(await storage.get(TEST_HANDSHAKE_KEY)).toBeNull();
        });

        it('redirects to original url', async () => {
          expect(window.location.href).toBe(testHandshakeState.originalUrl);
        });
      });

      describe('within iframe', () => {
        beforeEach(async () => {
          jest.mocked(isCallbackFromIframe).mockReturnValue(true);

          await subject.handleCallback();
        });

        it('does not fetch anything', () => {
          expect(fetchSpy).not.toHaveBeenCalled();
        });

        it('notifies parent', () => {
          expect(notifyParentFromIframe).toHaveBeenCalled();
        });
      });

      describe('when token lifetime is less than buffer time', () => {
        beforeEach(async () => {
          await storage.set(TEST_HANDSHAKE_KEY, testHandshakeState);
          const MOCK_RESPONSE_BODY = {
            access_token: 'test-new-access-token',
            refresh_token: 'test-new-refresh-token',
            expires_in: (BUFFER_MIN - 1) * 60,
            created_at: TEST_TIME.getTime() / 1000,
          };

          fetchSpy.mockResolvedValueOnce(
            new Response(JSON.stringify(MOCK_RESPONSE_BODY), {
              status: 200,
              statusText: 'OK',
            }),
          );
        });

        it('throws error ', async () => {
          await expect(subject.handleCallback()).rejects.toThrow(
            /Access token lifetime cannot be less than 5 minutes/,
          );
        });
      });
    });

    describe('redirectToAuthorize', () => {
      useFakeLocation();

      it('sets handshake state', async () => {
        expect(await storage.get(TEST_HANDSHAKE_KEY)).toBeNull();

        await subject.redirectToAuthorize();

        expect(await storage.get(TEST_HANDSHAKE_KEY)).toEqual(testHandshakeState);
      });

      it('redirects to authorize url', async () => {
        expect(window.location.href).toBe('http://localhost/');

        await subject.redirectToAuthorize();

        expect(window.location.href).toBe(testAuthroizeUrl);
      });
    });

    describe('onTokenChange', () => {
      it('returns function to unsubscribe listener', () => {});
    });
  });

  describe('with owner', () => {
    beforeEach(() => {
      subject = new DefaultOAuthClient({
        app: TEST_APP,
        storage,
        broadcaster,
        owner: TEST_OWNER,
      });
    });

    describe('getToken', () => {
      it('returns token if owner matches', async () => {
        const token = { ...TEST_TOKEN, owner: TEST_OWNER };
        await storage.set(TEST_TOKEN_KEY, token);

        const actual = await subject.getToken();

        expect(actual).toEqual(token);
      });
    });

    describe('handleCallback', () => {
      setupForHandleCallback();

      beforeEach(async () => {
        await storage.set(TEST_HANDSHAKE_KEY, testHandshakeState);
      });

      it('saves current owner with new token', async () => {
        expect(await storage.get(TEST_TOKEN_KEY)).toBeNull();

        await subject.handleCallback();

        expect(await storage.get(TEST_TOKEN_KEY)).toEqual({
          ...TEST_TOKEN_NEW,
          owner: TEST_OWNER,
        });
      });
    });

    describe('checkForValidToken', () => {
      it.each`
        desc                                | token                                   | expectation
        ${'when token has no owner'}        | ${TEST_TOKEN}                           | ${false}
        ${'when token has different owner'} | ${{ ...TEST_TOKEN, owner: 'test' }}     | ${false}
        ${'when token has same owner'}      | ${{ ...TEST_TOKEN, owner: TEST_OWNER }} | ${true}
      `('$desc, result=$expectation', async ({ token, expectation }) => {
        await storage.set(TEST_TOKEN_KEY, token);

        expect(await subject.checkForValidToken()).toBe(expectation);
      });
    });
  });

  describe('with tokenLifetime', () => {
    beforeEach(() => {
      subject = new DefaultOAuthClient({
        app: TEST_APP,
        storage,
        broadcaster,
        tokenLifetime: TEST_TOKEN_LIFETIME,
      });
    });

    it('uses the given tokenLifetime when saving new token', async () => {
      // Save expired token in storage
      await storage.set(TEST_TOKEN_KEY, {
        ...TEST_TOKEN,
        expiresAt: TEST_TIME.getTime(),
      });

      await subject.getToken();

      expect(await storage.get(TEST_TOKEN_KEY)).toEqual({
        ...TEST_TOKEN_NEW,
        expiresAt: (TEST_TOKEN_RESPONSE.created_at + TEST_TOKEN_LIFETIME) * 1000,
      });
    });
  });
});
