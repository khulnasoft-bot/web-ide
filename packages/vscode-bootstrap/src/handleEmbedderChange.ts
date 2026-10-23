import type { WebIDEConfigResponseMessage } from '@gitlab/cross-origin-channel';
import { defaultLogger } from '@gitlab/logger';
import { storageAvailable } from './utils/storageAvailable';
import { purgeClientStorage } from './utils/purgeClientStorage';
import { LAST_KNOWN_EMBEDDER_ORIGIN_STORAGE_KEY } from './constant';

/**
 * Detects if the origin embedding the Web IDE VSCode workbench changes
 * and purges browser storage if it does. It registers the new origin
 * in local storage for subsequent requests.
 *
 * @param message The first message sent by the embedder (WebIDEConfigResponseMessage).
 * @returns The message provided to the function.
 * @throws If localStorage is not available, an error is thrown.
 */
export const handleEmbedderChange = async (
  message: WebIDEConfigResponseMessage,
): Promise<WebIDEConfigResponseMessage> => {
  if (storageAvailable('localStorage')) {
    const lastKnownOrigin = localStorage.getItem(LAST_KNOWN_EMBEDDER_ORIGIN_STORAGE_KEY);
    const currentOrigin = message.origin || '';

    if (lastKnownOrigin && lastKnownOrigin !== currentOrigin) {
      defaultLogger.info(
        'Detected embedder origin change, purging web browser storage and registering new origin',
      );
      await purgeClientStorage();
    }

    localStorage.setItem(LAST_KNOWN_EMBEDDER_ORIGIN_STORAGE_KEY, currentOrigin);
  } else {
    const error = Error(
      'LocalStorage is not available and is required to proceed with the Web IDE Workbench initialization',
    );
    defaultLogger.error(error.message);
    throw error;
  }

  return message;
};
