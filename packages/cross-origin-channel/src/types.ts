import type {
  Disposable,
  ErrorType,
  TrackingEvent,
  WebIdeConfigLinks,
} from '@gitlab/web-ide-types';

interface BaseChannel<Message, MessageKey> extends Disposable {
  postMessage(message: Message): void;
  waitForMessage<T extends Message = Message>(messageKey: MessageKey, timeout?: number): Promise<T>;
  addMessageListener<T extends Message = Message>(
    messageKey: MessageKey,
    callback: (message: T) => void,
  ): Disposable;
  addMessagesListener(callback: (message: Message) => void): Disposable;
}

export interface AuthenticationTokenRequestMessage {
  key: 'authentication-token-request';
}

export interface AuthenticationTokenResponseMessage {
  key: 'authentication-token-response';
  params: {
    token: string;
  };
}

export interface AuthenticationTokenChangedMessage {
  key: 'authentication-token-changed';
}

export type PortChannelMessage =
  | AuthenticationTokenRequestMessage
  | AuthenticationTokenResponseMessage
  | AuthenticationTokenChangedMessage;

export type PortChannelMessageKey = PortChannelMessage['key'];

export interface PortChannel extends BaseChannel<PortChannelMessage, PortChannelMessageKey> {
  readonly messagePort: MessagePort;
  start: () => void;
}

export type PortName = 'auth-port';

export interface BaseWindowChannel {
  origin?: string;
}

export interface PortChannelRequestMessage extends BaseWindowChannel {
  key: 'port-channel-request';
  params: {
    name: PortName;
  };
}

export interface PortChannelResponseMessage extends BaseWindowChannel {
  key: 'port-channel-response';
  params: {
    name: PortName;
    port: MessagePort;
  };
}

export interface PortChannelResponseErrorMessage extends BaseWindowChannel {
  key: 'port-channel-response-error';
  params: {
    name: PortName;
    error: string;
  };
}

/**
 * Message sent to tell the parent window that the Web IDE is "ready".
 */
export interface ReadyMessage extends BaseWindowChannel {
  key: 'ready';
}

/**
 * Message sent to tell the parent window that an error occured.
 */
export interface ErrorMessage extends BaseWindowChannel {
  key: 'error';
  params: {
    errorType: ErrorType;
    details: unknown;
  };
}

export interface PreventUnloadMessage extends BaseWindowChannel {
  key: 'prevent-unload';
  params: {
    shouldPrevent: boolean;
  };
}

export interface WebIDETrackingMessage extends BaseWindowChannel {
  key: 'web-ide-tracking';
  params: {
    event: TrackingEvent;
  };
}

export interface UpdateWebIDEContextMessage extends BaseWindowChannel {
  key: 'update-web-ide-context';
  params: {
    ref: string;
    projectPath: string;
  };
}

export interface OpenURIMessage extends BaseWindowChannel {
  key: 'open-uri';
  params: {
    uriKey: keyof WebIdeConfigLinks;
  };
}

export interface SetHrefMessage extends BaseWindowChannel {
  key: 'set-href';
  params: {
    href: string;
  };
}

export interface WebIDEConfigRequestMessage extends BaseWindowChannel {
  key: 'web-ide-config-request';
}

export interface WebIDEConfigResponseMessage extends BaseWindowChannel {
  key: 'web-ide-config-response';
  params: {
    config: string;
  };
}

export interface WebIDECorsSuccessResponse extends BaseWindowChannel {
  key: 'web-ide-cors-success-response';
}

export type WindowChannelMessage =
  | PortChannelRequestMessage
  | PortChannelResponseMessage
  | PortChannelResponseErrorMessage
  | ReadyMessage
  | ErrorMessage
  | PreventUnloadMessage
  | WebIDETrackingMessage
  | UpdateWebIDEContextMessage
  | OpenURIMessage
  | SetHrefMessage
  | WebIDEConfigRequestMessage
  | WebIDEConfigResponseMessage
  | WebIDECorsSuccessResponse;

export type WindowChannelMessageKey = WindowChannelMessage['key'];

export interface CrossWindowChannel
  extends BaseChannel<WindowChannelMessage, WindowChannelMessageKey> {
  /**
   * Requests a PortChannel from the remote origin. The remote
   * origin should've created a `PortChannel` using `createLocalPortChannel(name)`
   * first.
   * @param name
   */
  requestRemotePortChannel(name: PortName): Promise<PortChannel>;
  /**
   * Creates a PortChannel in the local origin. A remote origin
   * can request to communicate with this PortChannel by requesting
   * it using `requestRemotePortChannel(name)`.
   * @param name
   */
  createLocalPortChannel(name: PortName): PortChannel;
}
