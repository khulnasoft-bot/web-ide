import type { Disposable } from '@gitlab/web-ide-types';
import type { PortChannel } from '@gitlab/cross-origin-channel';
import type { OAuthClient } from '@gitlab/oauth-client';
import { setupAutoRefresh } from '@gitlab/oauth-client';

interface AuthPortChannelControllerConstructorOptions {
  oauthClient: OAuthClient;

  authPort: PortChannel;
}

export class AuthPortChannelController implements Disposable {
  readonly #oauthClient: OAuthClient;

  readonly #authPort: PortChannel;

  readonly #disposable: Disposable;

  constructor({ oauthClient, authPort }: AuthPortChannelControllerConstructorOptions) {
    this.#oauthClient = oauthClient;
    this.#authPort = authPort;

    const tokenRequestDisposable = this.#authPort.addMessageListener(
      'authentication-token-request',
      async () => {
        this.#authPort.postMessage({
          key: 'authentication-token-response',
          params: { token: (await this.#oauthClient.getToken()).accessToken },
        });
      },
    );
    const disposeOnTokenChange = this.#oauthClient.onTokenChange(() => {
      this.#authPort.postMessage({ key: 'authentication-token-changed' });
    });
    const disposeAutoRefresh = setupAutoRefresh(this.#oauthClient);

    this.#disposable = {
      dispose: () => {
        tokenRequestDisposable.dispose();
        disposeOnTokenChange();
        disposeAutoRefresh();
      },
    };

    this.#authPort.start();
  }

  dispose() {
    this.#disposable.dispose();
  }
}
