import { basename } from './basename';

describe('utils-path/basename', () => {
  it.each`
    path                | expected
    ${''}               | ${'/'}
    ${'/'}              | ${'/'}
    ${'/foo'}           | ${'foo'}
    ${'foo'}            | ${'foo'}
    ${'/foo/bar.md'}    | ${'bar.md'}
    ${'/foo/bar/test/'} | ${'test'}
    ${'/foo /bar '}     | ${'bar '}
  `('with path="$path", expected="$expected"', ({ path, expected }) => {
    expect(basename(path)).toBe(expected);
  });
});
