export const VSCODE_WEB_DB_NAME = 'vscode-web-db';
export const VSCODE_GLOBAL_STATE_DB_NAME = 'vscode-web-state-db-global';

export const VSCODE_USER_DATA_STORE = 'vscode-userdata-store';
export const VSCODE_STATE_DATA_STORE = 'ItemTable';

export const VSCODE_EXTENSIONS_KEY = '/User/extensions.json';
export const VSCODE_EXTENSIONS_LAST_SYNCED_KEY = 'extensions.lastSyncUserData';

const openDb = async (dbName: string): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const vscodeWebDb = indexedDB.open(dbName);

    vscodeWebDb.onsuccess = () => {
      resolve(vscodeWebDb.result);
    };

    vscodeWebDb.onerror = () => {
      reject(vscodeWebDb.error);
    };
  });

const remove = async ({
  dbName,
  dbStoreName,
  key,
}: {
  dbName: string;
  dbStoreName: string;
  key: string;
}) => {
  const db = await openDb(dbName);

  return new Promise((resolve, reject) => {
    const storeExists = db.objectStoreNames.contains(dbStoreName);

    if (!storeExists) {
      db.close();
      resolve(true);
      return;
    }

    const request = db.transaction(dbStoreName, 'readwrite').objectStore(dbStoreName).delete(key);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };

    db.close();
  });
};

export const vsCodeWebExtensionsStore = {
  removeExtensions: async () =>
    remove({
      dbName: VSCODE_WEB_DB_NAME,
      dbStoreName: VSCODE_USER_DATA_STORE,
      key: VSCODE_EXTENSIONS_KEY,
    }),
  removeLastSyncedExtensionsData: async () =>
    remove({
      dbName: VSCODE_GLOBAL_STATE_DB_NAME,
      dbStoreName: VSCODE_STATE_DATA_STORE,
      key: VSCODE_EXTENSIONS_LAST_SYNCED_KEY,
    }),
};
