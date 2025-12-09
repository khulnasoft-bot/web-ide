import type { ErrorMessage, PortChannel, WindowChannelMessage } from '@gitlab/cross-origin-channel';
import { DefaultCrossWindowChannel } from '@gitlab/cross-origin-channel';
import {
  createConfig,
  createFakePartial,
  waitForPromises,
  createMockLocation,
  createFakeCrossWindowChannel,
} from '@khulnasoft/utils-test';
import { ErrorType, type WebIde, type WebIdeConfig } from '@khulnasoft/web-ide-types';
import { createOAuthClient } from '@gitlab/oauth-client';
import { defaultLogger } from '@gitlab/logger';
import { oauthCallback, pingWorkbench, start } from './index';
import type { UnloadPreventer } from './unloadPreventer';
import { createUnloadPreventer } from './unloadPreventer';
import { checkOAuthToken } from './checkOAuthToken';
import { AuthPortChannelController } from './AuthPortChannelController';
import { WEB_IDE_WORKBENCH_PING_IFRAME_ID, WEB_IDE_WORKBENCH_PING_TIMEOUT } from './constants';

jest.mock('./checkOAuthToken');
jest.mock('./unloadPreventer');
jest.mock('./AuthPortChannelController');
jest.mock('@gitlab/oauth-client');
jest.mock('@gitlab/cross-origin-channel');
jest.mock('@gitlab/logger');

const TEST_OAUTH_CLIENT: ReturnType<typeof createOAuthClient> = {
  checkForValidToken: jest.fn().mockResolvedValue(true),
  getToken: jest.fn().mockRejectedValue(undefined),
  handleCallback: jest.fn().mockResolvedValue(undefined),
  redirectToAuthorize: jest.fn().mockResolvedValue(undefined),
  onTokenChange: jest.fn(),
};

describe('web-ide/src/index', () => {
  let parentElement: Element;
  let unloadPreventerMock: UnloadPreventer;
  let mockCrossWindowChannel: DefaultCrossWindowChannel;
  const config: WebIdeConfig = createConfig();
  const getIframe = () => document.querySelector('iframe');
  const postMessage = (message: WindowChannelMessage) => {
    jest.mocked(mockCrossWindowChannel.addMessagesListener).mock.lastCall?.[0](message);
  };

  beforeEach(() => {
    parentElement = document.createElement('div');

    document.body.append(parentElement);

    unloadPreventerMock = {
      setShouldPrevent: jest.fn(),
      dispose: jest.fn(),
    };

    mockCrossWindowChannel = createFakeCrossWindowChannel();

    jest.mocked(mockCrossWindowChannel.waitForMessage).mockResolvedValue({ key: 'ready' });

    jest.mocked(createUnloadPreventer).mockReturnValueOnce(unloadPreventerMock);
    jest.mocked(createOAuthClient).mockReturnValue(TEST_OAUTH_CLIENT);

    jest.mocked(DefaultCrossWindowChannel).mockReturnValueOnce(mockCrossWindowChannel);
  });

  afterEach(() => {
    parentElement.remove();
  });

  describe('start', () => {
    let dispose: () => void;

    beforeEach(async () => {
      ({ dispose } = await start(parentElement, config));
    });

    it('creates an iframe', () => {
      expect(getIframe()?.src).toBe('https://ide.foo.bar/assets/workbench.html');
    });

    it('allows clipboard usage in the iframe', () => {
      expect(getIframe()?.getAttribute('allow')).toBe(
        'clipboard-read; clipboard-write; usb; serial; hid; cross-origin-isolated; autoplay;',
      );
    });

    it('creates a window channel instance', () => {
      const MockedDefaultWindowChannel = jest.mocked(DefaultCrossWindowChannel);
      const firstCallParams = MockedDefaultWindowChannel.mock.calls[0][0];

      // Jest toHaveBeenCalledWith and toBe assertions fail when comparing Window objects
      expect(Object.is(firstCallParams.localWindow, window)).toBe(true);
      expect(firstCallParams.remoteWindowOrigin).toBe(new URL(config.workbenchBaseUrl).origin);
    });

    it('waits for web-ide-config-request message', () => {
      expect(mockCrossWindowChannel.waitForMessage).toHaveBeenCalledWith('web-ide-config-request');
    });

    it('sends web-ide-config-response message', () => {
      expect(mockCrossWindowChannel.postMessage).toHaveBeenCalledWith({
        key: 'web-ide-config-response',
        params: {
          config: JSON.stringify(config),
        },
      });
    });

    it('waits for ready message', () => {
      expect(mockCrossWindowChannel.waitForMessage).toHaveBeenCalledWith('ready');
    });

    describe('when iframe receives web-ide-tracking message', () => {
      it('calls handleTracking handler and passes the message event parameter', async () => {
        const params = { event: { name: 'connect-to-remote' } };

        postMessage({ key: 'web-ide-tracking', params });

        expect(config.handleTracking).toHaveBeenCalledWith(params.event);
      });
    });

    describe('when inframe receives update-web-ide-context message', () => {
      it('calls handleUpdateUrl handler and passes the correct parameters', async () => {
        const params = { ref: 'test-branch', projectPath: config.projectPath };
        postMessage({ key: 'update-web-ide-context', params });

        expect(config.handleContextUpdate).toHaveBeenCalledWith(params);
      });
    });

    describe('on dispose', () => {
      it('removes iframe', () => {
        expect(getIframe()).not.toBe(null);

        dispose();

        expect(getIframe()).toBe(null);
      });

      it('disposes windowChannel', () => {
        dispose();

        expect(mockCrossWindowChannel.dispose).toHaveBeenCalled();
      });

      it('disposes unloadPreventer', () => {
        dispose();

        expect(unloadPreventerMock.dispose).toHaveBeenCalled();
      });
    });
  });

  describe('start', () => {
    it('resolves "ready" when "ready" message has been posted', async () => {
      jest.mocked(mockCrossWindowChannel.waitForMessage).mockResolvedValue({ key: 'ready' });

      const { ready } = await start(parentElement, config);

      expect(await ready).toBe(undefined);
    });

    describe('when receiving a 2nd web-ide-config-request message', () => {
      let realLocation: unknown;

      beforeEach(() => {
        realLocation = window.location;

        const mockLocation = createMockLocation();
        Object.defineProperty(window, 'location', {
          get() {
            return mockLocation;
          },
        });
      });

      afterEach(() => {
        Object.defineProperty(window, 'location', {
          get() {
            return realLocation;
          },
        });
      });

      it('reloads window', async () => {
        const { ready } = await start(parentElement, config);
        await ready;

        expect(mockCrossWindowChannel.addMessageListener).toHaveBeenCalledWith(
          'web-ide-config-request',
          expect.any(Function),
        );

        jest
          .mocked(mockCrossWindowChannel.addMessageListener)
          .mock.lastCall?.[1]({ key: 'web-ide-config-request' });

        expect(window.location.reload).toHaveBeenCalled();
      });
    });

    describe('when receiving a first web-ide-config-request message', () => {
      beforeEach(() => {
        jest.mocked(mockCrossWindowChannel.waitForMessage).mockImplementation(key => {
          if (key === 'web-ide-config-request') {
            return new Promise(() => {});
          }

          return Promise.resolve(createFakePartial<WindowChannelMessage>({ key }));
        });
      });
      it('does not window', () => {
        // eslint-disable-next-line no-void
        void start(parentElement, config);

        expect(mockCrossWindowChannel.addMessageListener).not.toHaveBeenCalled();
      });
    });

    it.each`
      expectedMessage
      ${'web-ide-config-request'}
      ${'ready'}
    `(
      'rejects "ready" promise when "$expectedMessage" message is not received',
      async ({ expectedMessage }) => {
        jest.mocked(mockCrossWindowChannel.waitForMessage).mockImplementation(key => {
          if (key === expectedMessage) {
            return Promise.reject(Error('timeout'));
          }

          return Promise.resolve(createFakePartial<WindowChannelMessage>({ key }));
        });

        const { ready } = await start(parentElement, config);

        await expect(ready).rejects.toThrow(Error);
        expect(defaultLogger.error).toHaveBeenCalled();
      },
    );

    it('rejects "ready" promise when "error" message is received', async () => {
      const errorMessage: ErrorMessage = {
        key: 'error',
        params: {
          errorType: ErrorType.START_WORKBENCH_FAILED,
          details: 'Could not load workbench assets',
        },
      };

      jest.mocked(mockCrossWindowChannel.waitForMessage).mockImplementation(key => {
        switch (key) {
          case 'error':
            return Promise.resolve(errorMessage);
          case 'ready':
            // Ensure that the error message is evaluated before the ready message
            return new Promise(resolve => {
              setTimeout(resolve, 500);
            });
          default:
            return Promise.resolve(createFakePartial<WindowChannelMessage>({ key }));
        }
      });

      const { ready } = await start(parentElement, config);

      await expect(ready).rejects.toEqual(
        Error('Error: start-workbench-failed: Could not load workbench assets'),
      );
      expect(defaultLogger.error).toHaveBeenCalled();
    });

    it('calls and waits for checkOAuthToken', async () => {
      const isFulfilledSpy = jest.fn();
      jest.mocked(checkOAuthToken).mockReturnValue(new Promise(() => {}));

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      start(parentElement, config).finally(isFulfilledSpy);
      await waitForPromises();

      expect(checkOAuthToken).toHaveBeenCalled();
      expect(isFulfilledSpy).not.toHaveBeenCalled();
    });

    describe('with oauth authentication', () => {
      let authPortChannelControllerMock: AuthPortChannelController;
      let authPortChannelMock: PortChannel;
      let webIde: WebIde;

      beforeEach(async () => {
        authPortChannelControllerMock = createFakePartial<AuthPortChannelController>({
          dispose: jest.fn(),
        });
        authPortChannelMock = createFakePartial<PortChannel>({});

        jest
          .mocked(mockCrossWindowChannel.createLocalPortChannel)
          .mockReturnValueOnce(authPortChannelMock);

        jest.mocked(AuthPortChannelController).mockReturnValue(authPortChannelControllerMock);
        webIde = await start(parentElement, {
          ...config,
          auth: {
            type: 'oauth',
            clientId: '123456',
            callbackUrl: 'https://example.com/oauth_callback',
          },
        });
      });

      it('creates an AuthPortChannelController instance with auth port channel', () => {
        expect(AuthPortChannelController).toHaveBeenCalledWith({
          oauthClient: TEST_OAUTH_CLIENT,
          authPort: authPortChannelMock,
        });
      });

      it('disposes AuthPortChannelController on web-ide dispose', () => {
        webIde.dispose();

        expect(authPortChannelControllerMock.dispose).toHaveBeenCalled();
      });
    });
  });

  describe('prevent-unload message', () => {
    beforeEach(async () => {
      await start(parentElement, config);

      getIframe()?.dispatchEvent(new Event('load'));
    });

    it.each([true, false])('updates uploadPreventer shouldPrevent state', async shouldPrevent => {
      postMessage({
        key: 'prevent-unload',
        params: {
          shouldPrevent,
        },
      });

      expect(unloadPreventerMock.setShouldPrevent).toHaveBeenCalledWith(shouldPrevent);
    });
  });

  describe('oauthCallback', () => {
    it('throws when called with something other than auth.type "oauth"', async () => {
      await expect(oauthCallback(config)).rejects.toThrowError(
        /Expected config.auth to be OAuth config./,
      );
    });

    it('calls handleCallback of OAuthClient', async () => {
      const oauthConfig: WebIdeConfig = {
        ...config,
        auth: {
          type: 'oauth',
          clientId: '123456',
          callbackUrl: 'https://example.com/oauth_callback',
        },
      };

      expect(createOAuthClient).not.toHaveBeenCalled();
      expect(TEST_OAUTH_CLIENT.handleCallback).not.toHaveBeenCalled();

      await oauthCallback(oauthConfig);

      expect(createOAuthClient).toHaveBeenCalledTimes(1);
      expect(createOAuthClient).toHaveBeenCalledWith({
        gitlabUrl: oauthConfig.gitlabUrl,
        oauthConfig: oauthConfig.auth,
      });
      expect(TEST_OAUTH_CLIENT.handleCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('pingWorkbench', () => {
    it('creates a hidden iframe that embeds the Web IDE workbench', async () => {
      pingWorkbench({ el: document.body, config }).catch(() => {});

      const iframe = document.getElementById(WEB_IDE_WORKBENCH_PING_IFRAME_ID);

      expect(iframe?.style.display).toBe('none');
      expect(iframe?.getAttribute('src')).toContain(config.workbenchBaseUrl);
    });

    it('waits for web-ide-config-request', () => {
      pingWorkbench({ el: document.body, config }).catch(() => {});

      expect(mockCrossWindowChannel.waitForMessage).toHaveBeenCalledWith(
        'web-ide-config-request',
        WEB_IDE_WORKBENCH_PING_TIMEOUT,
      );
    });

    it('allows specifying a custom time out for web-ide-config-request message', () => {
      const customTimeout = 2234234;

      pingWorkbench({ el: document.body, config, timeout: customTimeout }).catch(() => {});

      expect(mockCrossWindowChannel.waitForMessage).toHaveBeenCalledWith(
        'web-ide-config-request',
        customTimeout,
      );
    });

    describe('when web-ide-config-request message is received', () => {
      beforeEach(async () => {
        jest
          .mocked(mockCrossWindowChannel.waitForMessage)
          .mockResolvedValueOnce({ key: 'web-ide-config-request' });

        await pingWorkbench({ el: document.body, config });
      });

      it('removes iframe', () => {
        expect(document.getElementById(WEB_IDE_WORKBENCH_PING_IFRAME_ID)).toBe(null);
      });

      it('sends web-ide-config-response message', () => {
        expect(mockCrossWindowChannel.postMessage).toHaveBeenCalledWith({
          key: 'web-ide-config-response',
          params: { config: JSON.stringify(config) },
        });
      });

      it('waits for web-ide-cors-success-response message', () => {
        expect(mockCrossWindowChannel.waitForMessage).toHaveBeenCalledWith(
          'web-ide-cors-success-response',
          WEB_IDE_WORKBENCH_PING_TIMEOUT,
        );
      });
    });

    describe.each`
      timeoutMessage
      ${'web-ide-config-request'}
      ${'web-ide-cors-success-response'}
    `('when $timeoutMessage wait for message times out', ({ timeoutMessage }) => {
      beforeEach(async () => {
        jest.mocked(mockCrossWindowChannel.waitForMessage).mockImplementation(message => {
          if (message === timeoutMessage) {
            return Promise.reject(new Error());
          }

          return Promise.resolve(createFakePartial<WindowChannelMessage>({}));
        });
      });

      it('removes iframe', async () => {
        await expect(pingWorkbench({ el: document.body, config })).rejects.toThrow(Error);

        expect(document.getElementById(WEB_IDE_WORKBENCH_PING_IFRAME_ID)).toBe(null);
      });
    });
  });

  describe('when receiving an error message', () => {
    beforeEach(async () => {
      jest.mocked(mockCrossWindowChannel.waitForMessage).mockImplementation(message => {
        if (message === 'web-ide-cors-success-response') {
          return new Promise(resolve => {
            setTimeout(resolve, 2000);
          });
        }

        if (message === 'error') {
          return Promise.resolve(
            createFakePartial<WindowChannelMessage>({
              key: 'error',
              params: { errorType: ErrorType.START_WORKBENCH_FAILED, details: 'failed workbench' },
            }),
          );
        }

        return Promise.resolve(createFakePartial<WindowChannelMessage>({}));
      });
    });

    it('removes iframe', async () => {
      await expect(pingWorkbench({ el: document.body, config })).rejects.toThrow(
        Error('start-workbench-failed: failed workbench'),
      );

      expect(document.getElementById(WEB_IDE_WORKBENCH_PING_IFRAME_ID)).toBe(null);
    });
  });
});
