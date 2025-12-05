import { InMemorySecretStorageProvider } from './InMemorySecretStorageProvider';

const TEST_KEY = 'test-key';
const TEST_VALUE = 'test-value';

describe('vscode/secrets/InMemorySecretStorageProvider', () => {
  let subject: InMemorySecretStorageProvider;

  beforeEach(async () => {
    subject = new InMemorySecretStorageProvider();

    await subject.set(TEST_KEY, TEST_VALUE);
  });

  describe('set', () => {
    it('on existing key, overwrites', async () => {
      await subject.set(TEST_KEY, 'new-value');

      expect(await subject.get(TEST_KEY)).toBe('new-value');
    });
  });

  describe('get', () => {
    it('on known key, returns value', async () => {
      expect(await subject.get(TEST_KEY)).toBe(TEST_VALUE);
    });

    it('on unknown key, returns undefined', async () => {
      expect(await subject.get('dne')).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('on known key, removes value', async () => {
      await subject.delete(TEST_KEY);

      expect(await subject.get(TEST_KEY)).toBeUndefined();
    });

    it('on unknown key, does nothing', async () => {
      await subject.delete('dne');

      expect(await subject.get(TEST_KEY)).toBe(TEST_VALUE);
    });
  });
});
