import type { OAuthStateBroadcaster } from './types';

export const CHANNEL_NAME = 'gitlab_web_ide_oauth';
export const TOKEN_CHANGE_MESSAGE = 'token change';

export class DefaultOAuthStateBroadcaster implements OAuthStateBroadcaster {
  readonly #bc: BroadcastChannel;

  constructor() {
    this.#bc = new BroadcastChannel(CHANNEL_NAME);
  }

  notifyTokenChange(): void {
    this.#bc.postMessage(TOKEN_CHANGE_MESSAGE);
  }

  onTokenChange(callback: () => void) {
    const handler = (event: MessageEvent) => {
      if (event.data === TOKEN_CHANGE_MESSAGE) {
        callback();
      }
    };

    this.#bc.addEventListener('message', handler);

    return () => this.#bc.removeEventListener('message', handler);
  }

  dispose(): void {
    this.#bc.close();
  }
}
