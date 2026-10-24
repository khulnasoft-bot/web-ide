import type { Disposable } from '@khulnasoft/web-ide-types';
import { WAIT_FOR_MESSAGE_TIMEOUT } from './constants';
import type { PortChannel, PortChannelMessage, PortChannelMessageKey, PortName } from './types';

interface DefaultPortChannelConstructorOptions {
  name: PortName;
  messagePort: MessagePort;
}

export class DefaultPortChannel implements PortChannel {
  readonly messagePort: MessagePort;

  readonly name: PortName;

  constructor({ name, messagePort }: DefaultPortChannelConstructorOptions) {
    this.messagePort = messagePort;
    this.name = name;
  }

  dispose() {
    this.messagePort.close();
  }

  start() {
    this.messagePort.start();
  }

  addMessagesListener(callback: (message: PortChannelMessage) => void): Disposable {
    const port = this.messagePort;
    const listener = (event: MessageEvent<PortChannelMessage>) => {
      const message = event.data;

      callback(message);
    };

    port.addEventListener('message', listener);

    return {
      dispose() {
        port.removeEventListener('message', listener);
      },
    };
  }

  addMessageListener<T extends PortChannelMessage = PortChannelMessage>(
    messageKey: PortChannelMessageKey,
    callback: (message: T) => void,
  ): Disposable {
    return this.addMessagesListener(message => {
      if (message.key === messageKey) {
        callback(message as T);
      }
    });
  }

  postMessage(message: PortChannelMessage): void {
    this.messagePort.postMessage(message);
  }

  waitForMessage<T extends PortChannelMessage = PortChannelMessage>(
    messageKey: PortChannelMessageKey,
    timeout: number = WAIT_FOR_MESSAGE_TIMEOUT,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const disposable = this.addMessageListener<T>(messageKey, message => {
        resolve(message);
        disposable.dispose();
      });

      setTimeout(() => {
        disposable.dispose();
        reject(new Error(`Channel timed out while waiting for message ${messageKey}`));
      }, timeout);
    });
  }
}
