import { urlSafeBase64 } from './urlSafeBase64';

describe('urlSafeBase64', () => {
  it('converts a Uint8Array of character codes into base64 string', () => {
    const str = 'Hello world!';
    const strAsBase64 = btoa(str);
    const typedArray = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i += 1) {
      typedArray.set([str.charCodeAt(i)], i);
    }

    const actual = urlSafeBase64(typedArray);

    expect(actual).toBe(strAsBase64);
  });
});
