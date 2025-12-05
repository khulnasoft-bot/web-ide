import { DefaultStorageValueCache } from './DefaultStorageValueCache';
import type { OAuthTokenState } from './types';
import { InMemoryOAuthStorage } from '../test-utils';

const TEST_KEY = 'test-key-thing';
const TEST_VALUE: OAuthTokenState = {
  accessToken: 'access-token-123',
  expiresAt: 7,
  owner: 'root',
  refreshToken: 'refresh-token-123',
};

describe('DefaultStorageValueCache', () => {
  let storage: InMemoryOAuthStorage;
  let subject: DefaultStorageValueCache<OAuthTokenState | null>;

  beforeEach(() => {
    storage = new InMemoryOAuthStorage();
    subject = new DefaultStorageValueCache(storage, TEST_KEY);

    jest.spyOn(storage, 'get');
  });

  describe('getValue', () => {
    it('returns null if no value is set', async () => {
      expect(storage.get).not.toHaveBeenCalled();

      expect(await subject.getValue()).toBeUndefined();

      expect(storage.get).toHaveBeenCalledTimes(1);
    });

    it('when a value exists in storage, returns the value and caches it', async () => {
      await storage.set(TEST_KEY, TEST_VALUE);

      expect(await subject.getValue()).toBe(TEST_VALUE);
      expect(await subject.getValue()).toBe(TEST_VALUE);
      expect(await subject.getValue()).toBe(TEST_VALUE);

      expect(storage.get).toHaveBeenCalledTimes(1);
    });

    it('when called with force=true, always refetches the value', async () => {
      await storage.set(TEST_KEY, TEST_VALUE);

      expect(await subject.getValue(true)).toBe(TEST_VALUE);
      expect(await subject.getValue(true)).toBe(TEST_VALUE);

      await storage.remove(TEST_KEY);
      expect(await subject.getValue(true)).toBeUndefined();

      expect(storage.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('setValue', () => {
    it('saves value in storage', async () => {
      await subject.setValue(TEST_VALUE);

      expect(await storage.get(TEST_KEY)).toBe(TEST_VALUE);
    });

    it('caches value in memory', async () => {
      await subject.setValue(TEST_VALUE);

      expect(await subject.getValue()).toBe(TEST_VALUE);
      expect(storage.get).not.toHaveBeenCalled();
    });
  });

  describe('locking', () => {
    it('locks future operations until setter resolves', async () => {
      const results = Promise.all([
        subject.setValue(TEST_VALUE),
        subject.getValue(),
        subject.getValue(),
        subject.setValue(null),
        subject.getValue(),
      ]);

      expect(await results).toEqual([undefined, TEST_VALUE, TEST_VALUE, undefined, null]);
    });

    it('unlocks even if storage fails', async () => {
      const setError = new Error('BLOW UP in set!');
      const getError = new Error('BLOW UP in get!');

      jest.spyOn(storage, 'set').mockRejectedValue(setError);
      jest.spyOn(storage, 'get').mockRejectedValue(getError);

      const results = await Promise.allSettled([
        subject.setValue(TEST_VALUE),
        subject.getValue(),
        subject.setValue(null),
        subject.getValue(),
      ]);

      expect(results).toEqual([
        { status: 'rejected', reason: setError },
        { status: 'rejected', reason: getError },
        { status: 'rejected', reason: setError },
        { status: 'rejected', reason: getError },
      ]);
    });
  });
});
