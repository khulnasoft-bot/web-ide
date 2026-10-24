import { createFakePartial } from '@khulnasoft/utils-test';
import type { PortChannelMessage } from './types';
import { WAIT_FOR_MESSAGE_TIMEOUT } from './constants';
import { DefaultPortChannel } from './DefaultPortChannel';

describe('DefaultPortChannel', () => {
  const invokeMessageEventListeners = (messagePort: MessagePort, event: MessageEvent) => {
    jest.mocked(messagePort.addEventListener).mock.calls.forEach(([, handler]) => {
      if (typeof handler === 'function') {
        handler(event);
      } else {
        handler.handleEvent(event);
      }
    });
  };

  const createFakeMessagePort = (): MessagePort =>
    createFakePartial<MessagePort>({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      postMessage: jest.fn(),
      start: jest.fn(),
      close: jest.fn(),
    });

  describe('start', () => {
    it('should start the message port', () => {
      const mockMessagePort = createFakeMessagePort();

      const channel = new DefaultPortChannel({ name: 'auth-port', messagePort: mockMessagePort });
      channel.start();

      expect(mockMessagePort.start).toHaveBeenCalled();
    });
  });

  describe('postMessage', () => {
    it('should post the given message', () => {
      const message: PortChannelMessage = {
        key: 'authentication-token-response',
        params: { token: 'foo' },
      };
      const mockMessagePort = createFakeMessagePort();
      const channel = new DefaultPortChannel({ name: 'auth-port', messagePort: mockMessagePort });
      channel.postMessage(message);

      expect(mockMessagePort.postMessage).toHaveBeenCalledWith(message);
    });
  });

  describe('addMessagesListener', () => {
    let mockMessagePort: MessagePort;
    let channel: DefaultPortChannel;

    beforeEach(() => {
      mockMessagePort = createFakeMessagePort();
      channel = new DefaultPortChannel({ name: 'auth-port', messagePort: mockMessagePort });
    });

    it('returns a disposable that allows removing event listener from message port', () => {
      const listener = jest.fn();
      const disposable = channel.addMessagesListener(listener);

      disposable.dispose();

      expect(mockMessagePort.removeEventListener).toHaveBeenCalledWith(
        'message',
        jest.mocked(mockMessagePort.addEventListener).mock.calls[0][1],
      );
    });

    describe('when receiving expected message key', () => {
      it('invokes the callback function', () => {
        const callback = jest.fn();
        const event = new MessageEvent<PortChannelMessage>('message', {
          data: {
            key: 'authentication-token-changed',
          },
        });

        channel.addMessagesListener(callback);

        invokeMessageEventListeners(mockMessagePort, event);

        expect(callback).toHaveBeenCalledWith({
          key: 'authentication-token-changed',
        });
      });
    });

    describe('when receiving a different message key', () => {
      it('does not invoke the callback', () => {
        const callback = jest.fn();
        const event = new MessageEvent<PortChannelMessage>('message', {
          data: {
            key: 'authentication-token-changed',
          },
        });

        channel.addMessageListener('authentication-token-response', callback);

        invokeMessageEventListeners(mockMessagePort, event);

        expect(callback).not.toHaveBeenCalled();
      });
    });
  });

  describe('addMessageListener', () => {
    let mockMessagePort: MessagePort;
    let channel: DefaultPortChannel;

    beforeEach(() => {
      mockMessagePort = createFakeMessagePort();
      channel = new DefaultPortChannel({ name: 'auth-port', messagePort: mockMessagePort });
    });

    it('returns a disposable that allows removing event listener from message port', () => {
      const listener = jest.fn();
      const disposable = channel.addMessageListener('authentication-token-changed', listener);

      disposable.dispose();

      expect(mockMessagePort.removeEventListener).toHaveBeenCalledWith(
        'message',
        jest.mocked(mockMessagePort.addEventListener).mock.calls[0][1],
      );
    });

    describe('when receiving expected message key', () => {
      it('invokes the callback function', () => {
        const callback = jest.fn();
        const event = new MessageEvent<PortChannelMessage>('message', {
          data: {
            key: 'authentication-token-changed',
          },
        });

        channel.addMessageListener('authentication-token-changed', callback);

        invokeMessageEventListeners(mockMessagePort, event);

        expect(callback).toHaveBeenCalledWith({
          key: 'authentication-token-changed',
        });
      });
    });

    describe('when receiving a different message key', () => {
      it('does not invoke the callback', () => {
        const callback = jest.fn();
        const event = new MessageEvent<PortChannelMessage>('message', {
          data: {
            key: 'authentication-token-changed',
          },
        });

        channel.addMessageListener('authentication-token-response', callback);

        invokeMessageEventListeners(mockMessagePort, event);

        expect(callback).not.toHaveBeenCalled();
      });
    });
  });

  describe('waitForMessage', () => {
    jest.useFakeTimers();

    const mockMessagePort = createFakeMessagePort();
    const mockMessage: PortChannelMessage = {
      key: 'authentication-token-response',
      params: {
        token: 'foo',
      },
    };
    const messageEvent = new MessageEvent('message', {
      data: mockMessage,
      ports: [],
    });
    let channel: DefaultPortChannel;
    let waitForMessagePromise: Promise<PortChannelMessage>;

    beforeEach(() => {
      channel = new DefaultPortChannel({ name: 'auth-port', messagePort: mockMessagePort });
      waitForMessagePromise = channel.waitForMessage(mockMessage.key);
    });

    describe('when expected message is received', () => {
      it('returns the received message', async () => {
        invokeMessageEventListeners(mockMessagePort, messageEvent);

        expect(await waitForMessagePromise).toEqual(mockMessage);
      });

      it('removes the event listener after receiving the expected message', () => {
        invokeMessageEventListeners(mockMessagePort, messageEvent);

        expect(mockMessagePort.removeEventListener).toHaveBeenCalledWith(
          'message',
          jest.mocked(mockMessagePort.addEventListener).mock.calls[0][1],
        );
      });
    });

    describe('when expected message is not received', () => {
      it('should reject with a timeout error', async () => {
        jest.advanceTimersByTime(WAIT_FOR_MESSAGE_TIMEOUT);

        await expect(waitForMessagePromise).rejects.toThrow(/Channel timed out/);
      });
    });
  });

  describe('dispose', () => {
    it('should close the message port', () => {
      const mockMessagePort = createFakeMessagePort();
      const channel = new DefaultPortChannel({ name: 'auth-port', messagePort: mockMessagePort });

      channel.dispose();

      expect(mockMessagePort.close).toHaveBeenCalled();
    });
  });
});
