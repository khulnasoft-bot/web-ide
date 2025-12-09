import type { WebIDEConfigResponseMessage } from '@gitlab/cross-origin-channel';
import { defaultLogger } from '@gitlab/logger';
import { createFakePartial } from '@khulnasoft/utils-test';
import { handleEmbedderChange } from './handleEmbedderChange';
import { storageAvailable } from './utils/storageAvailable';
import { purgeClientStorage } from './utils/purgeClientStorage';
import { LAST_KNOWN_EMBEDDER_ORIGIN_STORAGE_KEY } from './constant';

jest.mock('./utils/storageAvailable');
jest.mock('./utils/purgeClientStorage');
jest.mock('@gitlab/logger', () => ({
  defaultLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('handleEmbedderChange', () => {
  const mockStorageAvailable = jest.mocked(storageAvailable);
  const mockPurgeClientStorage = jest.mocked(purgeClientStorage);
  const mockLogger = jest.mocked(defaultLogger);
  let mockLocalStorage: Storage;

  beforeEach(() => {
    mockLocalStorage = createFakePartial<Storage>({
      getItem: jest.fn(),
      setItem: jest.fn(),
    });

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    jest.clearAllMocks();
    mockPurgeClientStorage.mockResolvedValue();
  });

  const createTestMessage = (origin?: string): WebIDEConfigResponseMessage => ({
    key: 'web-ide-config-response',
    origin,
    params: {
      config: 'test-config',
    },
  });

  describe('when localStorage is available', () => {
    beforeEach(() => {
      mockStorageAvailable.mockReturnValue(true);
    });

    describe.each`
      lastKnownOrigin | currentOrigin
      ${'foo.com'}    | ${'bar.com'}
      ${'foo.com'}    | ${null}
      ${'bar.com'}    | ${''}
      ${''}           | ${'foo.com'}
      ${null}         | ${'bar.com'}
    `(
      'default (lastKnownOrigin=$lastKnownOrigin, currentOrigin=$currentOrigin)',
      ({ currentOrigin, lastKnownOrigin }) => {
        let result: WebIDEConfigResponseMessage;
        let message: WebIDEConfigResponseMessage;

        beforeEach(async () => {
          jest.mocked(mockLocalStorage.getItem).mockReturnValue(lastKnownOrigin);
          message = createTestMessage(currentOrigin);
          result = await handleEmbedderChange(message);
        });

        it('should store currentOrigin', () => {
          expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            LAST_KNOWN_EMBEDDER_ORIGIN_STORAGE_KEY,
            currentOrigin || '',
          );
        });

        it('returns message', () => {
          expect(result).toBe(message);
        });
      },
    );

    describe('when the origin matches the stored origin', () => {
      const origin = 'foo.bar';
      let message: WebIDEConfigResponseMessage;

      beforeEach(async () => {
        jest.mocked(mockLocalStorage.getItem).mockReturnValue(origin);
        message = createTestMessage(origin);
        await handleEmbedderChange(message);
      });

      it('should not purge storage', () => {
        expect(mockPurgeClientStorage).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });
    });

    describe.each(['', null])('when lastKnownOrigin is empty', lastKnownOrigin => {
      const origin = 'foo.bar';
      let message: WebIDEConfigResponseMessage;

      beforeEach(async () => {
        jest.mocked(mockLocalStorage.getItem).mockReturnValue(lastKnownOrigin);
        message = createTestMessage(origin);
        await handleEmbedderChange(message);
      });

      it('should not purge storage', () => {
        expect(mockPurgeClientStorage).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });
    });

    describe.each`
      lastKnownOrigin | currentOrigin
      ${'foo.com'}    | ${'bar.com'}
      ${'foo.com'}    | ${null}
      ${'bar.com'}    | ${''}
    `(
      'when the origin differs from the stored origin ($lastKnownOrigin, $currentOrigin)',
      ({ lastKnownOrigin, currentOrigin }) => {
        let message: WebIDEConfigResponseMessage;

        beforeEach(async () => {
          jest.mocked(mockLocalStorage.getItem).mockReturnValue(lastKnownOrigin);
          message = createTestMessage(currentOrigin);
          await handleEmbedderChange(message);
        });

        it('purges storage', async () => {
          expect(mockLogger.info).toHaveBeenCalledWith(
            'Detected embedder origin change, purging web browser storage and registering new origin',
          );
          expect(mockPurgeClientStorage).toHaveBeenCalledTimes(1);
        });
      },
    );
  });

  describe('when localStorage is not available', () => {
    beforeEach(() => {
      mockStorageAvailable.mockReturnValue(false);
    });

    it('throws an error indicating the lack of access to storage', async () => {
      const message = createTestMessage('https://gitlab.com');

      await expect(handleEmbedderChange(message)).rejects.toThrow(
        'LocalStorage is not available and is required to proceed with the Web IDE Workbench initialization',
      );
    });
  });
});
