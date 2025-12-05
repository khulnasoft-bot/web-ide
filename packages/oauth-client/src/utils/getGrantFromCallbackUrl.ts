import type { OAuthHandshakeState, OAuthTokenGrant } from '../types';

export const getGrantFromCallbackUrl = (
  callbackUrl: URL,
  handshakeState: OAuthHandshakeState,
): OAuthTokenGrant => {
  const stateParam = callbackUrl.searchParams.get('state');
  const code = callbackUrl.searchParams.get('code');

  if (handshakeState.state !== stateParam) {
    throw new Error('handshake state does not match received state');
  }

  if (!code) {
    throw new Error('code not found');
  }

  return {
    grant_type: 'authorization_code',
    code,
    code_verifier: handshakeState.codeVerifier,
  };
};
