import { defaultLogger } from '@gitlab/logger';
import { storageAvailable } from './storageAvailable';

/**
 * Deletes all IndexedDB databases if IndexedDB is accessible
 * @returns Promise that resolves when all databases are deleted
 */
async function deleteAllIndexedDBDatabases(): Promise<void> {
  if (typeof indexedDB === 'undefined' || !indexedDB) {
    return;
  }

  try {
    const databases = await indexedDB.databases();
    const namedDatabases = databases.filter(dbInfo => dbInfo.name);

    if (namedDatabases.length === 0) {
      defaultLogger.info('No IndexedDB databases found to delete');
      return;
    }

    const deletionPromises = namedDatabases.map(dbInfo => {
      const { name = '' } = dbInfo;

      return new Promise<void>((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(name);

        deleteRequest.onsuccess = () => {
          defaultLogger.info(`Successfully deleted database: ${name}`);
          resolve();
        };

        deleteRequest.onerror = () => {
          const requestError = deleteRequest.error?.message ?? 'unknown error';
          const error = new Error(
            `Failed to delete database (${name}) due to error: "${requestError}"`,
          );
          defaultLogger.error(error.message);
          reject(error);
        };

        deleteRequest.onblocked = () => {
          const error = new Error(
            `Failed to delete database (${name}) because it is in use. Please close all tabs running the Web IDE.`,
          );
          defaultLogger.error(error.message);
          reject(error);
        };
      });
    });

    await Promise.all(deletionPromises);

    defaultLogger.info('All IndexedDB databases have been deleted successfully');
  } catch (error) {
    defaultLogger.error('Error during IndexedDB cleanup');
    throw error;
  }
}

/**
 * Destroys client storage by clearing localStorage, sessionStorage
 * and indexedDB storage if available.
 */
export async function purgeClientStorage(): Promise<void> {
  if (storageAvailable('localStorage')) {
    localStorage.clear();
    defaultLogger.info('All localStorage data has been cleared');
  }

  if (storageAvailable('sessionStorage')) {
    sessionStorage.clear();
    defaultLogger.info('All sessionStorage data has been cleared');
  }

  await deleteAllIndexedDBDatabases();
}
