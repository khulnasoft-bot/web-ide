import { startWithSlash } from './startWithSlash';

describe('utils/path/startWithSlash', () => {
  it.each`
    input          | output
    ${''}          | ${'/'}
    ${'foo'}       | ${'/foo'}
    ${'/foo/bar'}  | ${'/foo/bar'}
    ${' /foo/bar'} | ${'/ /foo/bar'}
  `('with $input, returns $output', ({ input, output }: { input: string; output: string }) => {
    expect(startWithSlash(input)).toBe(output);
  });
});
