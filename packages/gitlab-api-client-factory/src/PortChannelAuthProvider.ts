import type { Disposable } from '@gitlab/web-ide-types';
import type { AuthProvider } from '@gitlab/gitlab-api-client';
import type { AuthenticationTokenResponseMessage, PortChannel } from '@gitlab/cross-origin-channel';

type OnTokenChange = () => void;

interface PortChannelAuthProviderConstructorOptions {
  portChannel: PortChannel;
  onTokenChange?: OnTokenChange;
}

export class PortChannelAuthProvider implements AuthProvider, Disposable {
  readonly #portChannel: PortChannel;

  readonly #onTokenChange?: OnTokenChange;

  readonly #disposable: Disposable;

  constructor({ portChannel, onTokenChange }: PortChannelAuthProviderConstructorOptions) {
    this.#portChannel = portChannel;
    this.#onTokenChange = onTokenChange;

    this.#disposable = this.#portChannel.addMessageListener('authentication-token-changed', () => {
      this.#onTokenChange?.();
    });

    this.#portChannel.start();
  }

  dispose() {
    this.#disposable.dispose();
  }

  async getToken(): Promise<string> {
    this.#portChannel.postMessage({ key: 'authentication-token-request' });
    const message = await this.#portChannel.waitForMessage<AuthenticationTokenResponseMessage>(
      'authentication-token-response',
    );

    return message.params.token;
  }
}
