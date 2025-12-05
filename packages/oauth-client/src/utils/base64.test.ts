import { decodeBase64, encodeBase64 } from './base64';

const TEST_CASES = [
  { text: '', base64: '' },
  { text: 'Hello World.', base64: 'SGVsbG8gV29ybGQu' },
  { text: 'Goodbye!', base64: 'R29vZGJ5ZSE=' },
];

describe('utils/base64', () => {
  describe('encodeBase64', () => {
    it.each(TEST_CASES)('encodes to base64 (with input="$text")', ({ text, base64 }) => {
      expect(encodeBase64(text)).toBe(base64);
    });
  });

  describe('decodeBase64', () => {
    it.each(TEST_CASES)('decodes from base64 (with input="$base64")', ({ text, base64 }) => {
      expect(decodeBase64(base64)).toBe(text);
    });
  });
});
