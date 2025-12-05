import type { OAuthHandshakeState } from '../types';
import { getGrantFromCallbackUrl } from './getGrantFromCallbackUrl';

const TEST_CALLBACK_URL_BASE = 'https://example.com/oauth_callback';
const TEST_CODE = 'random-code-abc';
const TEST_STATE = 'random-state-123';
const TEST_CODE_VERIFIER = 'random-code-verifier-abc';
const TEST_HANDSHAKE_STATE: OAuthHandshakeState = {
  codeVerifier: TEST_CODE_VERIFIER,
  originalUrl: '',
  state: TEST_STATE,
};

describe('utils/getGrantFromCallbackUrl', () => {
  const createCallbackUrl = (state: string, code: string) => {
    const url = new URL(TEST_CALLBACK_URL_BASE);
    url.searchParams.set('state', state);
    url.searchParams.set('code', code);

    return url;
  };

  it('returns authorization_code grant', () => {
    const callbackUrl = createCallbackUrl(TEST_STATE, TEST_CODE);

    const result = getGrantFromCallbackUrl(callbackUrl, TEST_HANDSHAKE_STATE);

    expect(result).toEqual({
      grant_type: 'authorization_code',
      code: TEST_CODE,
      code_verifier: TEST_CODE_VERIFIER,
    });
  });

  it('throws error if state does not match handshake state', () => {
    const callbackUrl = createCallbackUrl('dne-state', TEST_CODE);

    expect(() => getGrantFromCallbackUrl(callbackUrl, TEST_HANDSHAKE_STATE)).toThrowError(
      'handshake state does not match received state',
    );
  });

  it('throws if code is not found', () => {
    const callbackUrl = createCallbackUrl(TEST_STATE, '');

    expect(() => getGrantFromCallbackUrl(callbackUrl, TEST_HANDSHAKE_STATE)).toThrowError(
      'code not found',
    );
  });
});
