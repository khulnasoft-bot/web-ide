import { createOAuthClient } from '@gitlab/oauth-client';
import type { WebIdeConfig } from '@gitlab/web-ide-types';

export const checkOAuthToken = async (config: WebIdeConfig): Promise<void> => {
  if (config.auth.type === 'oauth') {
    const oauthClient = createOAuthClient({
      oauthConfig: config.auth,
      gitlabUrl: config.gitlabUrl,
      owner: config.username,
    });

    if (!(await oauthClient.checkForValidToken())) {
      await oauthClient.redirectToAuthorize();

      return new Promise(() => {
        // noop - never resolve. We should be redirecting...
      });
    }
  }

  return Promise.resolve();
};
