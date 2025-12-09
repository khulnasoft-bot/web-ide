import type { Disposable } from '@khulnasoft/web-ide-types';
import { DefaultPortChannel } from './DefaultPortChannel';
import type {
  PortChannel,
  CrossWindowChannel,
  WindowChannelMessage,
  WindowChannelMessageKey,
  PortName,
  PortChannelResponseMessage,
  PortChannelRequestMessage,
} from './types';
import { WAIT_FOR_MESSAGE_TIMEOUT } from './constants';

interface WindowChannelConstructorOptions {
  remoteWindowOrigin: string;
  remoteWindow: Window;
  localWindow: Window;
}

export class DefaultCrossWindowChannel implements CrossWindowChannel {
  readonly #localWindow: Window;

  readonly #remoteWindow: Window;

  readonly #remoteWindowOrigin: string;

  readonly #messageChannels: Map<PortName, MessageChannel>;

  readonly #disposables: Disposable[];

  constructor({ localWindow, remoteWindow, remoteWindowOrigin }: WindowChannelConstructorOptions) {
    this.#localWindow = localWindow;
    this.#remoteWindow = remoteWindow;
    this.#remoteWindowOrigin = remoteWindowOrigin;
    this.#messageChannels = new Map<PortName, MessageChannel>();
    this.#disposables = [];

    this.#disposables.push(
      this.addMessageListener<PortChannelRequestMessage>('port-channel-request', event => {
        const { name } = event.params;
        const channel = this.#messageChannels.get(name);

        if (channel) {
          this.postMessage({ key: 'port-channel-response', params: { name, port: channel.port2 } });
        } else {
          this.postMessage({
            key: 'port-channel-response-error',
            params: { name, error: `Could not find a port with name ${name}` },
          });
        }
      }),
    );
  }

  dispose() {
    this.#disposables.forEach(disposable => {
      disposable.dispose();
    });
  }

  postMessage(message: WindowChannelMessage): void {
    if (message.key === 'port-channel-response') {
      this.#remoteWindow.postMessage(
        { key: message.key, params: { name: message.params.name } },
        this.#remoteWindowOrigin,
        [message.params.port],
      );
    } else {
      this.#remoteWindow.postMessage(message, this.#remoteWindowOrigin);
    }
  }

  addMessagesListener(callback: (message: WindowChannelMessage) => void): Disposable {
    const localWindow = this.#localWindow;
    const remoteWindowOrigin = this.#remoteWindowOrigin;

    const listener = (event: MessageEvent<WindowChannelMessage>) => {
      const message = { ...event.data, origin: event.origin };

      if (event.source !== this.#remoteWindow && event.origin !== remoteWindowOrigin) {
        return;
      }

      if (message.key === 'port-channel-response') {
        callback({
          key: 'port-channel-response',
          origin: message.origin,
          params: { name: message.params.name, port: event.ports[0] },
        });
      } else {
        callback(message);
      }
    };

    localWindow.addEventListener('message', listener);

    return {
      dispose() {
        localWindow.removeEventListener('message', listener);
      },
    };
  }

  addMessageListener<T extends WindowChannelMessage = WindowChannelMessage>(
    targetMessageKey: WindowChannelMessageKey,
    callback: (message: T) => void,
  ): Disposable {
    return this.addMessagesListener(message => {
      if (message.key === targetMessageKey) {
        callback(message as T);
      }
    });
  }

  waitForMessage<T extends WindowChannelMessage = WindowChannelMessage>(
    targetMessageKey: WindowChannelMessageKey,
    timeout: number = WAIT_FOR_MESSAGE_TIMEOUT,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const disposable = this.addMessageListener<T>(targetMessageKey, message => {
        resolve(message);
        disposable.dispose();
      });

      setTimeout(() => {
        disposable.dispose();
        reject(new Error(`Channel timed out while waiting for message ${targetMessageKey}`));
      }, timeout);
    });
  }

  async requestRemotePortChannel(name: PortName): Promise<PortChannel> {
    this.postMessage({ key: 'port-channel-request', params: { name } });

    const message = await this.waitForMessage<PortChannelResponseMessage>('port-channel-response');

    return new DefaultPortChannel({ name, messagePort: message.params.port });
  }

  createLocalPortChannel(name: PortName): PortChannel {
    let channel = this.#messageChannels.get(name);

    if (!channel) {
      channel = new MessageChannel();
      this.#messageChannels.set(name, channel);
    }

    return new DefaultPortChannel({ name, messagePort: channel.port1 });
  }
}
