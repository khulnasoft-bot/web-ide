import { joinPaths } from './joinPaths';

describe('utils/path/joinPaths', () => {
  it.each`
    input                       | output
    ${[]}                       | ${''}
    ${['']}                     | ${''}
    ${['abc/', '/def']}         | ${'abc/def'}
    ${['/', '', '/def']}        | ${'/def'}
    ${[null, 'abc/def', 'zoo']} | ${'abc/def/zoo'}
  `('with $input, returns $output', ({ input, output }: { input: string[]; output: string }) => {
    expect(joinPaths(...input)).toBe(output);
  });
});
