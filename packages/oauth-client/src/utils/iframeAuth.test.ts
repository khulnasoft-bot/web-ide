import { createFakePartial } from '@gitlab/utils-test';
import {
  authorizeGrantWithIframe,
  isCallbackFromIframe,
  notifyParentFromIframe,
} from './iframeAuth';
import type { OAuthApp, OAuthHandshakeState, OAuthTokenGrant } from '../types';
import { generateAuthorizeUrl } from './generateAuthorizeUrl';
import { waitForMessage } from './waitForMessage';

jest.mock('./waitForMessage');

const TEST_CALLBACK_URL_BASE = 'https://example.com/oauth_callback';
const TEST_CODE = 'random-code-abc';
const TEST_OAUTH_APP: OAuthApp = {
  authorizeUrl: 'https://example.com/oauth/authorize',
  callbackUrl: TEST_CALLBACK_URL_BASE,
  clientId: 'test-client-id',
  tokenUrl: 'https://example.com/oauth/token',
};

describe('utils/iframeAuth', () => {
  let windowParent: Window;
  let resolveWaitForMessage: () => void;

  const createCallbackUrl = (state: string, code: string) => {
    const url = new URL(TEST_CALLBACK_URL_BASE);
    url.searchParams.set('state', state);
    url.searchParams.set('code', code);

    return url;
  };

  const findIframe = () => {
    const iframe = document.querySelector('iframe');

    if (!iframe) {
      throw new Error('Expected to find iframe');
    }

    return iframe;
  };

  const setIframeHref = (href: string) => {
    Object.defineProperty(findIframe(), 'contentWindow', {
      get() {
        return createFakePartial<Window>({
          location: createFakePartial<Location>({
            href,
          }),
        });
      },
    });
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'parent', {
      get() {
        return windowParent;
      },
    });

    jest.mocked(waitForMessage).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveWaitForMessage = resolve;
        }),
    );
  });

  describe('authorizeGrantWithIframe', () => {
    let result: Promise<OAuthTokenGrant>;
    let onFulfilledSpy: jest.Mock<void, []>;
    let expectedAuthorizeUrl: string;
    let expectedHandshakeState: OAuthHandshakeState;

    beforeEach(async () => {
      onFulfilledSpy = jest.fn();
      result = authorizeGrantWithIframe(TEST_OAUTH_APP).then(x => {
        onFulfilledSpy();

        return x;
      });

      ({ url: expectedAuthorizeUrl, handshakeState: expectedHandshakeState } =
        await generateAuthorizeUrl(TEST_OAUTH_APP));
    });

    it('creates iframe', async () => {
      const iframe = findIframe();
      expect(iframe).not.toBeUndefined();
      expect(iframe.src).toBe(expectedAuthorizeUrl);
      expect(iframe.style).toMatchObject({
        width: '0px',
        height: '0px',
        position: 'absolute',
      });
    });

    it('does not resolve right away', async () => {
      expect(onFulfilledSpy).not.toHaveBeenCalled();
    });

    it('waits for "web-ide-oauth-handshake-ready" message', () => {
      expect(waitForMessage).toHaveBeenCalledTimes(1);

      const waitPredicate = jest.mocked(waitForMessage).mock.calls[0][0];

      expect(waitPredicate('foo')).toBe(false);
      expect(waitPredicate('web-ide-oauth-handshake-ready')).toBe(true);
    });

    describe('when iframe posts ready message', () => {
      beforeEach(async () => {
        setIframeHref(createCallbackUrl(expectedHandshakeState.state, TEST_CODE).href);

        resolveWaitForMessage();
      });

      it('resolves with grant', async () => {
        expect(onFulfilledSpy).toHaveBeenCalled();
        const grant = await result;

        expect(grant).toEqual({
          grant_type: 'authorization_code',
          code_verifier: expectedHandshakeState.codeVerifier,
          code: TEST_CODE,
        });
      });
    });

    describe('when iframe posts ready and href is falsey', () => {
      beforeEach(async () => {
        setIframeHref('');

        resolveWaitForMessage();
      });

      it('rejects with error', async () => {
        await expect(result).rejects.toThrow(/Could not read callback href/);
      });
    });
  });

  describe('isCallbackFromIframe', () => {
    it.each`
      desc                                 | parent    | expected
      ${'when window.parent is self'}      | ${window} | ${false}
      ${'when window.parent is different'} | ${{}}     | ${true}
    `('$desc, returns $expected', ({ parent, expected }) => {
      windowParent = parent;

      expect(isCallbackFromIframe()).toBe(expected);
    });
  });

  describe('notifyParentFromIframe', () => {
    it('posts message to parent frame', () => {
      windowParent = createFakePartial<Window>({
        postMessage: jest.fn(),
      });

      expect(windowParent.postMessage).not.toHaveBeenCalled();

      notifyParentFromIframe();

      expect(windowParent.postMessage).toHaveBeenCalledTimes(1);
      expect(windowParent.postMessage).toHaveBeenCalledWith(
        'web-ide-oauth-handshake-ready',
        window.location.origin,
      );
    });
  });
});
