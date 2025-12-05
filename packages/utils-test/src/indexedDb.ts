import { IDBFactory as FakeIDBFactory } from 'fake-indexeddb';

const openDb = (databaseName: string, objectStoreName: string): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const db = indexedDB.open(databaseName);

    db.onupgradeneeded = () => {
      db.result.createObjectStore(objectStoreName);
    };

    db.onsuccess = () => {
      resolve(db.result);
    };

    db.onerror = () => {
      reject(db.error);
    };
  });

const promisifyRequest = (request: IDBRequest) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

export const withFakeIndexedDbStorage = () => {
  let origIndexedDB: IDBFactory;

  beforeEach(() => {
    origIndexedDB = window.indexedDB;
    window.indexedDB = new FakeIDBFactory();
  });

  afterEach(() => {
    window.indexedDB = origIndexedDB;
  });

  return {
    async populateObjectStoreWithMockData(
      databaseName: string,
      objectStoreName: string,
      key: string,
    ) {
      const db = await openDb(databaseName, objectStoreName);
      const request = db
        .transaction(objectStoreName, 'readwrite')
        .objectStore(objectStoreName)
        .put('value', key);
      db.close();

      return promisifyRequest(request);
    },

    async getFromObjectStore(databaseName: string, objectStoreName: string, key: string) {
      const db = await openDb(databaseName, objectStoreName);

      const request = db
        .transaction(objectStoreName, 'readonly')
        .objectStore(objectStoreName)
        .get(key);
      db.close();

      return promisifyRequest(request);
    },
  };
};
