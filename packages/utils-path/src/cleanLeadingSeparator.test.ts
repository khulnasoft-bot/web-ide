import { cleanLeadingSeparator } from './cleanLeadingSeparator';

describe('utils/path/cleanLeadingSeparator', () => {
  it.each`
    input          | output
    ${''}          | ${''}
    ${'foo'}       | ${'foo'}
    ${'/foo/bar/'} | ${'foo/bar/'}
    ${' /foo/bar'} | ${' /foo/bar'}
  `('with $input, returns $output', ({ input, output }: { input: string; output: string }) => {
    expect(cleanLeadingSeparator(input)).toBe(output);
  });
});
