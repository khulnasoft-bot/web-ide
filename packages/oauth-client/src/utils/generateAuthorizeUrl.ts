import { customAlphabet } from 'nanoid/async';
import type { OAuthApp, OAuthHandshakeState } from '../types';
import { sha256ForUrl } from './sha256ForUrl';

const nanoid = customAlphabet('0123456789abcdef', 10);

interface AuthorizeUrlResult {
  readonly handshakeState: OAuthHandshakeState;
  readonly url: string;
}

export const generateAuthorizeUrl = async (app: OAuthApp): Promise<AuthorizeUrlResult> => {
  const authorizeUrl = new URL(app.authorizeUrl);

  const state = await nanoid(32);
  const codeVerifier = await nanoid(32);
  const codeChallenge = sha256ForUrl(codeVerifier);
  const originalUrl = document.location.href;

  authorizeUrl.searchParams.set('client_id', app.clientId);
  authorizeUrl.searchParams.set('redirect_uri', app.callbackUrl);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'api');
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');

  return {
    url: authorizeUrl.href,
    handshakeState: {
      state,
      codeVerifier,
      originalUrl,
    },
  };
};
