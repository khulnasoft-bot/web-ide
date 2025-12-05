import type { CrossWindowChannel } from '@gitlab/cross-origin-channel';
import { handleMediatorMessages } from '@gitlab/vscode-mediator-commands';
import { WEB_IDE_EXTENSION_ID } from '@gitlab/web-ide-interop';

type MessagePortsControllerOptions = {
  windowChannel: CrossWindowChannel;
};

export class MessagePortsController {
  readonly #webIdeChannel: MessageChannel;

  readonly #messagePorts: Map<string, MessagePort>;

  constructor(options: MessagePortsControllerOptions) {
    const webIdeChannel = new MessageChannel();
    const messagePorts = new Map<string, MessagePort>();
    messagePorts.set(WEB_IDE_EXTENSION_ID, webIdeChannel.port2);

    handleMediatorMessages(webIdeChannel.port1, options.windowChannel);

    this.#messagePorts = messagePorts;
    this.#webIdeChannel = webIdeChannel;
  }

  get messagePorts(): ReadonlyMap<string, MessagePort> {
    return this.#messagePorts;
  }

  onTokenChange() {
    this.#webIdeChannel.port1.postMessage('webide_auth_change');
  }
}
