import type { OAuthClient } from './OAuthClient';
import { BUFFER_MS } from './utils';

// note: We want to be a little less than BUFFER_MS so we are guaranteed to refresh
const REFRESH_DELAY_BUFFER_MS = BUFFER_MS - 60 * 1000;

export const setupAutoRefresh = (oauthClient: OAuthClient) => {
  let refreshTimeout: undefined | NodeJS.Timeout;

  const setupRefreshForCurrentToken = async () => {
    clearTimeout(refreshTimeout);
    refreshTimeout = undefined;

    const token = await oauthClient.getToken();

    if (token.expiresAt) {
      const delay = token.expiresAt - Date.now() - REFRESH_DELAY_BUFFER_MS;

      refreshTimeout = setTimeout(() => {
        // note: This will trigger refresh. It's okay to fire and forget.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        oauthClient.getToken();
      }, delay);
    }
  };

  const disposeTokenChangeListener = oauthClient.onTokenChange(setupRefreshForCurrentToken);

  // why: It's okay to fire and forget here
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  setupRefreshForCurrentToken();

  return () => {
    disposeTokenChangeListener();
    clearTimeout(refreshTimeout);
  };
};
