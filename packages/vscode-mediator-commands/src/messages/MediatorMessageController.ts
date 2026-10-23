import type {
  CrossWindowChannel,
  PreventUnloadMessage,
  UpdateWebIDEContextMessage,
  WebIDETrackingMessage,
} from '@gitlab/cross-origin-channel';
import type { WebIdeConfigLinks } from '@gitlab/web-ide-types';
import {
  MESSAGE_OPEN_URI,
  MESSAGE_PREVENT_UNLOAD,
  MESSAGE_READY,
  MESSAGE_SET_HREF,
  MESSAGE_TRACK_EVENT,
  MESSAGE_UPDATE_WEB_IDE_CONTEXT,
} from '../constants';

export const createMediatorMessageController = (windowChannel: CrossWindowChannel) => ({
  [MESSAGE_READY]() {
    windowChannel.postMessage({ key: 'ready' });
  },

  [MESSAGE_PREVENT_UNLOAD](params: PreventUnloadMessage['params']) {
    windowChannel.postMessage({ key: 'prevent-unload', params });
  },

  [MESSAGE_OPEN_URI]({ key }: { key: keyof WebIdeConfigLinks }) {
    windowChannel.postMessage({
      key: 'open-uri',
      params: {
        uriKey: key,
      },
    });
  },

  [MESSAGE_TRACK_EVENT](params: WebIDETrackingMessage['params']) {
    windowChannel.postMessage({ key: 'web-ide-tracking', params });
  },

  [MESSAGE_SET_HREF](href: string) {
    windowChannel.postMessage({ key: 'set-href', params: { href } });
  },

  [MESSAGE_UPDATE_WEB_IDE_CONTEXT](params: UpdateWebIDEContextMessage['params']) {
    windowChannel.postMessage({ key: 'update-web-ide-context', params });
  },
});

export type MediatorMessageController = ReturnType<typeof createMediatorMessageController>;

/**
 * List of all keys handled by the MediatorMessageController
 */
export type MediatorMessageKey = keyof MediatorMessageController;

/**
 * An object containing a MediatorMessageKey and the params associated with it
 */
export interface MediatorMessageEvent<T extends MediatorMessageKey> {
  key: T;
  params: Parameters<MediatorMessageController[T]>;
}

// what: Declare a typesafe collection of all keys to use when we evaluate
//       an unknown incoming message. Using a `Record` (as opposed to an `Array`)
//       enforces we include a value for each key.
export const MEDIATOR_MESSAGE_KEYS: Record<MediatorMessageKey, true> = {
  [MESSAGE_OPEN_URI]: true,
  [MESSAGE_PREVENT_UNLOAD]: true,
  [MESSAGE_READY]: true,
  [MESSAGE_SET_HREF]: true,
  [MESSAGE_TRACK_EVENT]: true,
  [MESSAGE_UPDATE_WEB_IDE_CONTEXT]: true,
};
