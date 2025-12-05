import { cleanEndingSeparator } from './cleanEndingSeparator';

describe('utils/path/cleanLeadingSeparator', () => {
  it.each`
    input           | output
    ${''}           | ${''}
    ${'foo'}        | ${'foo'}
    ${'/foo/bar/'}  | ${'/foo/bar'}
    ${'/foo/bar/ '} | ${'/foo/bar/ '}
  `('with $input, returns $output', ({ input, output }: { input: string; output: string }) => {
    expect(cleanEndingSeparator(input)).toBe(output);
  });
});
