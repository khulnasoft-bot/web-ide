import { createFakePartial } from '@khulnasoft/utils-test';
import type { Disposable } from '@khulnasoft/web-ide-types';
import { DefaultCrossWindowChannel } from './DefaultCrossWindowChannel';
import type {
  PortChannelRequestMessage,
  PortChannelResponseMessage,
  PortName,
  WindowChannelMessage,
} from './types';

describe('DefaultCrossWindowChannel', () => {
  let defaultWindowChannel: DefaultCrossWindowChannel;
  let localWindow: Window;
  let remoteWindow: Window;
  const REMOTE_WINDOW_ORIGIN = 'http://example.com';
  const TEST_MESSAGE: PortChannelRequestMessage = {
    key: 'port-channel-request',
    params: {
      name: 'auth-port',
    },
  };
  const invokeMessageEventListeners = (window: Window, event: MessageEvent) => {
    jest.mocked(window.addEventListener).mock.calls.forEach(([, handler]) => {
      if (typeof handler === 'function') {
        handler(event);
      } else {
        handler.handleEvent(event);
      }
    });
  };

  beforeEach(() => {
    global.MessageChannel = jest.fn().mockImplementation(() =>
      createFakePartial<MessageChannel>({
        port1: createFakePartial<MessagePort>({}),
        port2: createFakePartial<MessagePort>({}),
      }),
    );

    localWindow = createFakePartial<Window>({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      postMessage: jest.fn(),
    });
    remoteWindow = createFakePartial<Window>({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      postMessage: jest.fn(),
    });

    defaultWindowChannel = new DefaultCrossWindowChannel({
      localWindow,
      remoteWindow,
      remoteWindowOrigin: REMOTE_WINDOW_ORIGIN,
    });
  });

  describe('postMessage', () => {
    it('posts messages to the target window', () => {
      defaultWindowChannel.postMessage(TEST_MESSAGE);

      expect(remoteWindow.postMessage).toHaveBeenCalledWith(TEST_MESSAGE, REMOTE_WINDOW_ORIGIN);
    });

    describe('when message is port-channel-response message', () => {
      const portChannelResponseMessage: PortChannelResponseMessage = {
        key: 'port-channel-response',
        params: {
          name: 'auth-port',
          port: createFakePartial<MessagePort>({}),
        },
      };

      it('sends port as a transferable object', () => {
        defaultWindowChannel.postMessage(portChannelResponseMessage);

        expect(remoteWindow.postMessage).toHaveBeenCalledWith(
          {
            key: 'port-channel-response',
            params: { name: 'auth-port' },
          },
          REMOTE_WINDOW_ORIGIN,
          [portChannelResponseMessage.params.port],
        );
      });
    });
  });

  describe('addMessagesListener', () => {
    let disposable: Disposable;
    let listener: jest.Mock;

    beforeEach(() => {
      listener = jest.fn();

      disposable = defaultWindowChannel.addMessagesListener(listener);
    });

    it('listens for messages on the localWindow', () => {
      invokeMessageEventListeners(
        localWindow,
        new MessageEvent<WindowChannelMessage>('message', {
          origin: REMOTE_WINDOW_ORIGIN,
          data: TEST_MESSAGE,
        }),
      );

      expect(listener).toHaveBeenCalledWith({ ...TEST_MESSAGE, origin: REMOTE_WINDOW_ORIGIN });
    });

    it('returns a disposable that allows removing event listener', () => {
      disposable.dispose();

      const nativeListener = jest.mocked(localWindow.addEventListener).mock.lastCall?.[1];

      expect(localWindow.removeEventListener).toHaveBeenCalledWith('message', nativeListener);
    });

    describe('when the receive message has incorrect origin', () => {
      beforeEach(() => {
        invokeMessageEventListeners(
          localWindow,
          new MessageEvent<WindowChannelMessage>('message', {
            data: TEST_MESSAGE,
          }),
        );
      });

      it('ignores the message', () => {
        expect(listener).not.toHaveBeenCalled();
      });
    });

    describe('when the event source is the remote window', () => {
      beforeEach(() => {
        invokeMessageEventListeners(
          localWindow,
          new MessageEvent<WindowChannelMessage>('message', {
            data: TEST_MESSAGE,
            origin: REMOTE_WINDOW_ORIGIN,
            source: remoteWindow,
          }),
        );
      });

      it('accepts messages from any origin', () => {
        expect(listener).toHaveBeenCalledWith({ ...TEST_MESSAGE, origin: REMOTE_WINDOW_ORIGIN });
      });
    });
  });

  describe('addMessageListener', () => {
    let disposable: Disposable;
    let listener: jest.Mock;

    beforeEach(() => {
      listener = jest.fn();

      disposable = defaultWindowChannel.addMessageListener(TEST_MESSAGE.key, listener);
    });

    it('returns a disposable that allows removing event listener', () => {
      disposable.dispose();

      const nativeListener = jest.mocked(localWindow.addEventListener).mock.lastCall?.[1];

      expect(localWindow.removeEventListener).toHaveBeenCalledWith('message', nativeListener);
    });

    describe('when receiving expected message key', () => {
      it('invokes the callback function', () => {
        const event = new MessageEvent<WindowChannelMessage>('message', {
          data: TEST_MESSAGE,
          origin: REMOTE_WINDOW_ORIGIN,
        });

        invokeMessageEventListeners(localWindow, event);

        expect(listener).toHaveBeenCalledWith({ ...TEST_MESSAGE, origin: REMOTE_WINDOW_ORIGIN });
      });
    });

    describe('when receiving unexpected message key', () => {
      it('does not invoke the callback function', () => {
        const event = new MessageEvent<WindowChannelMessage>('message', {
          data: {
            key: 'port-channel-response-error',
            params: { name: 'auth-port', error: 'error' },
          },
          origin: REMOTE_WINDOW_ORIGIN,
        });

        invokeMessageEventListeners(localWindow, event);

        expect(listener).not.toHaveBeenCalled();
      });
    });
  });

  describe('requestRemotePortChannel', () => {
    it('posts a port-channel-request message to targetWindow', () => {
      defaultWindowChannel.requestRemotePortChannel('auth-port').catch(() => {});

      expect(remoteWindow.postMessage).toHaveBeenCalledWith(
        {
          key: 'port-channel-request',
          params: { name: 'auth-port' },
        },
        REMOTE_WINDOW_ORIGIN,
      );
    });

    describe('when targetWindow responds with a port-channel-response message', () => {
      it('returns the response as PortChannel', async () => {
        const port = createFakePartial<MessagePort>({});
        const portChannelResponseMessage: PortChannelResponseMessage = {
          key: 'port-channel-response',
          params: {
            name: 'auth-port',
            port,
          },
        };

        const portChannelPromise = defaultWindowChannel.requestRemotePortChannel('auth-port');
        const messageEvent = new MessageEvent('message', {
          data: portChannelResponseMessage,
          origin: REMOTE_WINDOW_ORIGIN,
          ports: [port],
        });

        invokeMessageEventListeners(localWindow, messageEvent);

        const portChannel = await portChannelPromise;

        expect(portChannel.messagePort).toBe(port);
      });
    });

    describe('when channel does not receive a valid response and times out', () => {
      jest.useFakeTimers();

      it('throws a timeout error', async () => {
        const promise = defaultWindowChannel.requestRemotePortChannel('auth-port');

        jest.runAllTimers();

        await expect(promise).rejects.toThrow(/timed out/);
      });
    });
  });

  describe('createLocalPortChannel', () => {
    it('does not create a port channel twice', () => {
      const portChannelOne = defaultWindowChannel.createLocalPortChannel('auth-port');
      const portChannelTwo = defaultWindowChannel.createLocalPortChannel('auth-port');

      expect(portChannelOne.messagePort).toBe(portChannelTwo.messagePort);
    });

    describe('when origin window receives a port-channel-request message', () => {
      const sendPortChannelRequestMessage = (name: PortName) => {
        invokeMessageEventListeners(
          localWindow,
          new MessageEvent('message', {
            origin: REMOTE_WINDOW_ORIGIN,
            data: { key: 'port-channel-request', params: { name } },
          }),
        );
      };

      describe('when port has been created', () => {
        beforeEach(() => {
          defaultWindowChannel.createLocalPortChannel('auth-port');
        });

        it('sends port-channel-response to the target window', () => {
          sendPortChannelRequestMessage('auth-port');

          expect(remoteWindow.postMessage).toHaveBeenCalledWith(
            {
              key: 'port-channel-response',
              params: { name: 'auth-port' },
            },
            REMOTE_WINDOW_ORIGIN,
            expect.arrayContaining([createFakePartial<MessagePort>({})]),
          );
        });
      });

      describe('when port has not been created', () => {
        it('sends port-channel-response to the target window', () => {
          sendPortChannelRequestMessage('auth-port');

          expect(remoteWindow.postMessage).toHaveBeenCalledWith(
            {
              key: 'port-channel-response-error',
              params: { name: 'auth-port', error: expect.any(String) },
            },
            REMOTE_WINDOW_ORIGIN,
          );
        });
      });
    });
  });
});
