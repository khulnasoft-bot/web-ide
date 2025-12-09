// TODO: For some reason `ts-jest` isn't finding the `.d.ts` files
import '../../vscode.proposed.ipc.d';

import type {
  MediatorMessageEvent,
  MediatorMessageKey,
} from '@khulnasoft/vscode-mediator-commands';
import {
  MESSAGE_PREVENT_UNLOAD,
  MESSAGE_SET_HREF,
  MESSAGE_OPEN_URI,
  MESSAGE_UPDATE_WEB_IDE_CONTEXT,
} from '@khulnasoft/vscode-mediator-commands';

import { getExtensionContext } from '../context';

// what: These are type aliases for expected params of these messages:
type OpenUriParams = MediatorMessageEvent<typeof MESSAGE_OPEN_URI>['params'];
type PreventUnloadParams = MediatorMessageEvent<typeof MESSAGE_PREVENT_UNLOAD>['params'];
type SetHrefParams = MediatorMessageEvent<typeof MESSAGE_SET_HREF>['params'];
type UpdateWebIdeContext = MediatorMessageEvent<typeof MESSAGE_UPDATE_WEB_IDE_CONTEXT>['params'];

/**
 * Helper method to enforce that we are only sending MediatorMessageEvent's
 */
const postMessage = <T extends MediatorMessageKey>(message: MediatorMessageEvent<T>) => {
  getExtensionContext().messagePassingProtocol?.postMessage(message);
};

// region: Exported methods that are used across the extension
export const openUri = (...params: OpenUriParams) => postMessage({ key: MESSAGE_OPEN_URI, params });

export const preventUnload = (...params: PreventUnloadParams) =>
  postMessage({ key: MESSAGE_PREVENT_UNLOAD, params });

export const setHref = (...params: SetHrefParams) => postMessage({ key: MESSAGE_SET_HREF, params });

export const updateWebIdeContext = (...params: UpdateWebIdeContext) =>
  postMessage({ key: MESSAGE_UPDATE_WEB_IDE_CONTEXT, params });
