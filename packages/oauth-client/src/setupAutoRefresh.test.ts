import type { OAuthClient } from './OAuthClient';
import { setupAutoRefresh } from './setupAutoRefresh';
import type { OAuthTokenState } from './types';

const FAKE_TIME = new Date('2020-01-03T05:00:00Z');
const FAKE_EXPIRES_TIME = new Date('2020-01-03T10:00:00Z');

const TEST_TOKEN: OAuthTokenState = {
  accessToken: 'test-access-token',
  expiresAt: FAKE_EXPIRES_TIME.getTime(),
};

const TEST_NEW_TOKEN: OAuthTokenState = {
  accessToken: 'test-new-access-token',
  expiresAt: 0,
};

// note: I hardcode 4 minutes here because I want to test that explicit timing
const FOUR_MINUTES_MS = 4 * 60 * 1000;

describe('setupAutoRefresh', () => {
  let dispose: () => void;
  let oauthClientFake: OAuthClient;

  const updateTokenAndTrigger = (token: OAuthTokenState) => {
    jest.mocked(oauthClientFake.getToken).mockResolvedValue(token);

    jest.mocked(oauthClientFake.onTokenChange).mock.calls.forEach(([callback]) => {
      callback();
    });
  };

  const getOnTokenChangeDispose = () =>
    jest.mocked(oauthClientFake.onTokenChange).mock.results[0].value;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(FAKE_TIME);

    oauthClientFake = {
      checkForValidToken: jest.fn(),
      getToken: jest.fn().mockResolvedValue(TEST_TOKEN),
      handleCallback: jest.fn(),
      onTokenChange: jest.fn().mockImplementation(() => jest.fn()),
      redirectToAuthorize: jest.fn(),
    };

    dispose = setupAutoRefresh(oauthClientFake);

    // Clear initial token read since we're interested in after timeouts are set
    jest.mocked(oauthClientFake.getToken).mockClear();
  });

  afterEach(() => {
    dispose();
  });

  describe('when expiresAt time has not quite elapsed', () => {
    beforeEach(() => {
      jest.advanceTimersByTime(
        FAKE_EXPIRES_TIME.getTime() - FAKE_TIME.getTime() - FOUR_MINUTES_MS - 1,
      );
    });

    it('does not dispose onTokenChange listener', () => {
      expect(getOnTokenChangeDispose()).not.toHaveBeenCalled();
    });

    it('does not fetch new token', () => {
      expect(oauthClientFake.getToken).not.toHaveBeenCalled();
    });

    describe('when token has been updated and more time elapsed', () => {
      beforeEach(() => {
        updateTokenAndTrigger(TEST_NEW_TOKEN);

        jest.mocked(oauthClientFake.getToken).mockClear();

        jest.advanceTimersByTime(99999);
      });

      it('does not fetch new token because timeout has been cleared', () => {
        expect(oauthClientFake.getToken).not.toHaveBeenCalled();
      });
    });
  });

  describe('when expiresAt time has elapsed', () => {
    beforeEach(() => {
      jest.advanceTimersByTime(FAKE_EXPIRES_TIME.getTime() - FAKE_TIME.getTime() - FOUR_MINUTES_MS);
    });

    it('fetches new token that triggers refresh', () => {
      expect(oauthClientFake.getToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('when disposed', () => {
    beforeEach(() => {
      dispose();
    });

    it('disposes token change listener', () => {
      expect(getOnTokenChangeDispose()).toHaveBeenCalled();
    });

    it('does not refresh when expiresAt time has elapsed', () => {
      jest.advanceTimersByTime(FAKE_EXPIRES_TIME.getTime() - FAKE_TIME.getTime() - FOUR_MINUTES_MS);

      expect(oauthClientFake.getToken).not.toHaveBeenCalled();
    });
  });
});
