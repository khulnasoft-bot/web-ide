import { defaultLogger } from '@gitlab/logger';
import { createFakePartial, withFakeIndexedDbStorage } from '@gitlab/utils-test';
import { purgeClientStorage } from './purgeClientStorage';
import { storageAvailable } from './storageAvailable';

// Mock dependencies
jest.mock('./storageAvailable');
jest.mock('@gitlab/logger', () => ({
  defaultLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('purgeClientStorage', () => {
  const mockStorageAvailable = jest.mocked(storageAvailable);
  const mockLogger = jest.mocked(defaultLogger);
  const indexedDbHelpers = withFakeIndexedDbStorage();
  let mockLocalStorage: Storage;
  let mockSessionStorage: Storage;

  beforeEach(() => {
    mockLocalStorage = createFakePartial<Storage>({
      clear: jest.fn(),
    });

    mockSessionStorage = createFakePartial<Storage>({
      clear: jest.fn(),
    });

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });
    jest.clearAllMocks();
  });

  describe('localStorage and sessionStorage clearing', () => {
    it('should clear localStorage when available', async () => {
      mockStorageAvailable.mockImplementation(type => type === 'localStorage');

      await purgeClientStorage();

      expect(mockStorageAvailable).toHaveBeenCalledWith('localStorage');
      expect(mockStorageAvailable).toHaveBeenCalledWith('sessionStorage');
      expect(mockLocalStorage.clear).toHaveBeenCalledTimes(1);
      expect(mockSessionStorage.clear).not.toHaveBeenCalled();
    });

    it('should clear sessionStorage when available', async () => {
      mockStorageAvailable.mockImplementation(type => type === 'sessionStorage');

      await purgeClientStorage();

      expect(mockStorageAvailable).toHaveBeenCalledWith('localStorage');
      expect(mockStorageAvailable).toHaveBeenCalledWith('sessionStorage');
      expect(mockLocalStorage.clear).not.toHaveBeenCalled();
      expect(mockSessionStorage.clear).toHaveBeenCalledTimes(1);
    });

    it('should not clear any storage when neither is available', async () => {
      mockStorageAvailable.mockReturnValue(false);

      await purgeClientStorage();

      expect(mockLocalStorage.clear).not.toHaveBeenCalled();
      expect(mockSessionStorage.clear).not.toHaveBeenCalled();
    });
  });

  describe('IndexedDB database deletion', () => {
    describe('when databases exist', () => {
      beforeEach(async () => {
        await indexedDbHelpers.populateObjectStoreWithMockData('testDb1', 'store1', 'key1');
        await indexedDbHelpers.populateObjectStoreWithMockData('testDb2', 'store2', 'key2');
      });

      it('should delete all IndexedDB databases when they exist', async () => {
        await purgeClientStorage();

        expect(mockLogger.info).toHaveBeenCalledWith('Successfully deleted database: testDb1');
        expect(mockLogger.info).toHaveBeenCalledWith('Successfully deleted database: testDb2');
        expect(mockLogger.info).toHaveBeenCalledWith(
          'All IndexedDB databases have been deleted successfully',
        );

        // Verify databases are deleted
        const databases = await indexedDB.databases();
        expect(databases).toHaveLength(0);
      });
    });

    describe('when no databases exist', () => {
      it('should log when no IndexedDB databases are found', async () => {
        await purgeClientStorage();

        expect(mockLogger.info).toHaveBeenCalledWith('No IndexedDB databases found to delete');
        expect(mockLogger.info).not.toHaveBeenCalledWith(
          'All IndexedDB databases have been deleted successfully',
        );
      });
    });

    it.each`
      errorType          | handleName     | params | errorMessage
      ${'request error'} | ${'onerror'}   | ${{}}  | ${'Failed to delete database (testDb1) due to error: "Deletion failed"'}
      ${'blocked db'}    | ${'onblocked'} | ${{}}  | ${'Failed to delete database (testDb1) because it is in use. Please close all tabs running the Web IDE.'}
    `(
      'handles $errorType event',
      async ({
        handleName,
        params,
        errorMessage,
      }: {
        handleName: keyof Pick<IDBOpenDBRequest, 'onerror' | 'onblocked'>;
        params: Event & IDBVersionChangeEvent;
        errorMessage: string;
      }) => {
        const dbRequest = createFakePartial<IDBOpenDBRequest>({
          error: createFakePartial<DOMException>({ message: 'Deletion failed' }),
        });
        // Mock deleteDatabase to simulate an error
        const originalDeleteDatabase = indexedDB.deleteDatabase;
        jest.spyOn(indexedDB, 'deleteDatabase').mockImplementation(() => {
          setTimeout(() => {
            dbRequest[handleName]?.(params);
          }, 10);

          return dbRequest;
        });

        await indexedDbHelpers.populateObjectStoreWithMockData('testDb1', 'store1', 'key1');

        await expect(purgeClientStorage()).rejects.toThrow(Error);

        expect(mockLogger.error).toHaveBeenCalledWith(errorMessage);
        expect(mockLogger.error).toHaveBeenLastCalledWith('Error during IndexedDB cleanup');

        // Restore original method
        indexedDB.deleteDatabase = originalDeleteDatabase;
      },
    );
  });
});
