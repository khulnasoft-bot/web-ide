import { sha256ForUrl } from './sha256ForUrl';

describe('utils/sha256ForUrl', () => {
  // You can test these outputs locally by running something like:
  //
  // ```
  // echo -n "Hello World" | openssl dgst -binary -sha256 | openssl base64
  // ```
  it.each`
    input            | output
    ${'Hello World'} | ${'pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4'}
    ${'Goodbye!'}    | ${'HLeyIbet2hz0xHJLMjaTlFgEgMhKuDV5XWCKxZqhMAI'}
  `('with input="$input", should return a sha256 hash', ({ input, output }) => {
    const actual = sha256ForUrl(input);

    expect(actual).toBe(output);
  });
});
