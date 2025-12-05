import { dirname } from './dirname';

describe('utils/path/dirname', () => {
  it.each`
    path                | expected
    ${''}               | ${'/'}
    ${'/'}              | ${'/'}
    ${'/foo'}           | ${'/'}
    ${'foo'}            | ${'/'}
    ${'/foo/bar'}       | ${'/foo'}
    ${'/foo/bar/test/'} | ${'/foo/bar'}
    ${'/foo /bar'}      | ${'/foo '}
  `('with path="$path", expected="$expected"', ({ path, expected }) => {
    expect(dirname(path)).toBe(expected);
  });
});
