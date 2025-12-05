import { ReadonlySecretStorageProvider } from './ReadonlySecretStorageProvider';

const TEST_KEY_1 = 'test-key-1';
const TEST_KEY_2 = 'test-key-2';
const TEST_VALUE_1 = 'test-value-1';
const TEST_VALUE_2 = 'test-value-2';

describe('vscode/secrets/ReadonlySecretStorageProvider', () => {
  let subject: ReadonlySecretStorageProvider;

  beforeEach(() => {
    subject = new ReadonlySecretStorageProvider([
      [key => key === TEST_KEY_1, () => Promise.resolve(TEST_VALUE_1)],
      [key => key === TEST_KEY_2, () => Promise.resolve(TEST_VALUE_2)],
    ]);
  });

  describe('get', () => {
    it.each`
      key           | expectation
      ${TEST_KEY_1} | ${TEST_VALUE_1}
      ${TEST_KEY_2} | ${TEST_VALUE_2}
      ${'dne'}      | ${undefined}
    `('with $key, should return $expectation', async ({ key, expectation }) => {
      const result = await subject.get(key);

      expect(result).toBe(expectation);
    });
  });

  describe('set', () => {
    it('does nothing', async () => {
      await subject.set(TEST_KEY_1, 'NEW VALUE!');

      expect(await subject.get(TEST_KEY_1)).toBe(TEST_VALUE_1);
    });
  });

  describe('delete', () => {
    it('does nothing', async () => {
      await subject.delete(TEST_KEY_1);

      expect(await subject.get(TEST_KEY_1)).toBe(TEST_VALUE_1);
    });
  });
});
