import { oauthCallback } from '@gitlab/web-ide';
import { getOAuthCallbackUrl } from './config';
import { loadConfig } from './configStorage';
import { addParamsToOriginalUrl } from './utils/oauthHandshakeState';
import type { ExampleConfig } from './types';

const savedConfig = loadConfig();

if (!savedConfig) {
  throw new Error('Could not find client config!');
}

const url = new URL(document.location.href);
const config = savedConfig.config as ExampleConfig;

addParamsToOriginalUrl(config.clientId, {
  autostart: 'true',
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
oauthCallback({
  gitlabUrl: config.gitlabUrl,
  auth: {
    type: 'oauth',
    callbackUrl: getOAuthCallbackUrl(),
    clientId: config.clientId,
    // why: Let's use regular refreshToken since we can't silently reauth in the example app
    protectRefreshToken: false,
  },
  username: url.searchParams.get('username') || undefined,
});
