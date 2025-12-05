import type { OAuthApp, OAuthTokenGrant } from '../types';
import { waitForMessage } from './waitForMessage';
import { generateAuthorizeUrl } from './generateAuthorizeUrl';
import { getGrantFromCallbackUrl } from './getGrantFromCallbackUrl';

const MSG_WEB_IDE_OAUTH_HANDSHAKE_READY = 'web-ide-oauth-handshake-ready';

export const isCallbackFromIframe = () => window !== window.parent;

export const notifyParentFromIframe = () => {
  window.parent.postMessage(MSG_WEB_IDE_OAUTH_HANDSHAKE_READY, window.location.origin);
};

export const authorizeGrantWithIframe = async (app: OAuthApp): Promise<OAuthTokenGrant> => {
  const { url: authorizeUrl, handshakeState } = await generateAuthorizeUrl(app);

  // TODO: What about timeout?
  const readyAsync = waitForMessage(data => data === MSG_WEB_IDE_OAUTH_HANDSHAKE_READY);

  const authorizeIframe = document.createElement('iframe');
  authorizeIframe.src = authorizeUrl;
  authorizeIframe.style.width = '0';
  authorizeIframe.style.height = '0';
  authorizeIframe.style.border = 'none';
  authorizeIframe.style.position = 'absolute';
  document.body.appendChild(authorizeIframe);

  await readyAsync;

  const callbackHref = authorizeIframe.contentWindow?.location.href;
  if (!callbackHref) {
    throw new Error('Could not read callback href');
  }
  const callbackUrl = new URL(callbackHref);

  return getGrantFromCallbackUrl(callbackUrl, handshakeState);
};
