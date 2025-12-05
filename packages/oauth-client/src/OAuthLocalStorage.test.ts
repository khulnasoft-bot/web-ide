import { OAuthLocalStorage } from './OAuthLocalStorage';
import { encodeBase64 } from './utils';

const TEST_KEY = 'test-key';
const TEST_VALUE = {
  foo: 'bar',
  lorem: 'ipsum',
  num: 123,
};

describe('OAuthLocalStorage', () => {
  let subject: OAuthLocalStorage;

  afterEach(() => {
    window.localStorage.clear();
  });

  describe('default', () => {
    beforeEach(() => {
      subject = new OAuthLocalStorage();
    });

    describe('get', () => {
      it('returns null if not json encoded base64 object', async () => {
        window.localStorage.setItem(TEST_KEY, 'foo');
        const result = await subject.get(TEST_KEY);

        expect(result).toBeNull();
      });

      it('returns null if nothing found', async () => {
        const result = await subject.get(TEST_KEY);

        expect(result).toBeNull();
      });

      it('returns object in local storage', async () => {
        window.localStorage.setItem(TEST_KEY, encodeBase64(JSON.stringify(TEST_VALUE)));
        const result = await subject.get(TEST_KEY);

        expect(result).toEqual(TEST_VALUE);
      });
    });

    describe('set', () => {
      it('updates localStorage with value', async () => {
        expect(window.localStorage.getItem(TEST_KEY)).toBeNull();

        await subject.set(TEST_KEY, TEST_VALUE);

        expect(window.localStorage.getItem(TEST_KEY)).toBe(
          encodeBase64(JSON.stringify(TEST_VALUE)),
        );
      });
    });

    describe('remove', () => {
      it('removes key from localStorage', async () => {
        window.localStorage.setItem(TEST_KEY, 'foo');

        await subject.remove(TEST_KEY);

        expect(window.localStorage.getItem(TEST_KEY)).toBeNull();
      });
    });
  });

  describe('with excludeKeys', () => {
    beforeEach(() => {
      subject = new OAuthLocalStorage({
        excludeKeys: ['lorem'],
      });
    });

    describe('set', () => {
      it('strips excludeKeys from object', async () => {
        await subject.set(TEST_KEY, TEST_VALUE);

        expect(window.localStorage.getItem(TEST_KEY)).toBe(
          encodeBase64(JSON.stringify({ foo: 'bar', num: 123 })),
        );
      });

      it('can set non-object values', async () => {
        await subject.set(TEST_KEY, 7);

        expect(window.localStorage.getItem(TEST_KEY)).toBe(encodeBase64('7'));
      });
    });
  });
});
