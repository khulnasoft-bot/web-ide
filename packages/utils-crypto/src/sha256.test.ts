import { sha256 } from './sha256';
import { urlSafeBase64 } from './urlSafeBase64';

describe('sha256', () => {
  const LONG_INPUT = Array(100).fill('Lorem ipsum dolar sit amit.\n').join('');

  // Verify output with the following command:
  // ```
  // echo -n "test123" | openssl dgst -binary -sha256 | openssl base64
  // ```
  it.each`
    input         | output
    ${''}         | ${'47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU='}
    ${'a'}        | ${'ypeBEsobvcr6wjGzmiPcTaeG7_gUfE5yuYB3ha_uSLs='}
    ${'test123'}  | ${'7NcYcNGWMxapfjrDQIyYNa2M8PPBvHA1J8MCZVNPda4='}
    ${LONG_INPUT} | ${'dcfG6GxnVCqimHtrI91JkY00Oawb--0IO1dhRwHQh50='}
  `(
    'with input of size $input.length, returns sha256 hash',
    ({ input, output }: { input: string; output: string }) => {
      const inputEncoded = new TextEncoder().encode(input);
      const result = sha256(inputEncoded);

      expect(urlSafeBase64(result)).toBe(output);
    },
  );
});
