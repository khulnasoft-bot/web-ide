import type { WebIdeConfig } from '@gitlab/web-ide-types';
import type { OAuthClient } from '@gitlab/oauth-client';
import { createConfig, createFakePartial, waitForPromises } from '@gitlab/utils-test';
import { createOAuthClient } from '@gitlab/oauth-client';
import { checkOAuthToken } from './checkOAuthToken';

jest.mock('@gitlab/oauth-client');

describe('checkOAuthToken', () => {
  const TEST_OAUTH_CONFIG: WebIdeConfig = {
    ...createConfig(),
    auth: {
      type: 'oauth',
      callbackUrl: 'test-callback-url',
      clientId: 'test-client-id',
    },
    username: 'lorem',
  };

  let testOAuthClient: OAuthClient;
  let result: Promise<void>;

  beforeEach(() => {
    testOAuthClient = createFakePartial<OAuthClient>({
      checkForValidToken: jest.fn().mockResolvedValue(true),
      redirectToAuthorize: jest.fn().mockResolvedValue(undefined),
    });

    jest.mocked(createOAuthClient).mockReturnValue(testOAuthClient);
  });

  describe('if auth is not oauth', () => {
    beforeEach(() => {
      result = checkOAuthToken({
        ...TEST_OAUTH_CONFIG,
        auth: { type: 'token', token: 'lorem' },
      });
    });

    it('does not create oauth client', () => {
      expect(createOAuthClient).not.toHaveBeenCalled();
    });

    it('resolves', async () => {
      await expect(result).resolves.toBeUndefined();
    });
  });

  describe('if auth is oauth and token valid', () => {
    beforeEach(() => {
      result = checkOAuthToken(TEST_OAUTH_CONFIG);
    });

    it('creates oauth client and calls check', () => {
      expect(createOAuthClient).toHaveBeenCalledTimes(1);
      expect(createOAuthClient).toHaveBeenCalledWith({
        gitlabUrl: TEST_OAUTH_CONFIG.gitlabUrl,
        oauthConfig: TEST_OAUTH_CONFIG.auth,
        owner: 'lorem',
      });

      expect(testOAuthClient.checkForValidToken).toHaveBeenCalled();
    });

    it('does not call redirect', () => {
      expect(testOAuthClient.redirectToAuthorize).not.toHaveBeenCalled();
    });

    it('resolves', async () => {
      await expect(result).resolves.toBeUndefined();
    });
  });

  describe('if auth is oauth and token invalid', () => {
    beforeEach(() => {
      jest.mocked(testOAuthClient.checkForValidToken).mockResolvedValue(false);
      result = checkOAuthToken(TEST_OAUTH_CONFIG);
    });

    it('calls redirect', () => {
      expect(testOAuthClient.redirectToAuthorize).toHaveBeenCalled();
    });

    it('does not resolve', async () => {
      const onFulfilled = jest.fn();
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      result.finally(onFulfilled);

      await waitForPromises();

      expect(onFulfilled).not.toHaveBeenCalled();
    });
  });
});
