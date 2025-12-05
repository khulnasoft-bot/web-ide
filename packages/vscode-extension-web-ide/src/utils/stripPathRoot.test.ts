import { stripPathRoot } from './stripPathRoot';

describe('utils/stripPathRoot', () => {
  it.each`
    path                            | root                  | expectation
    ${''}                           | ${''}                 | ${''}
    ${'/gitlab-ui/src/foo.js'}      | ${'gitlab-ui'}        | ${'src/foo.js'}
    ${'/gitlab-ui/src/foo.js'}      | ${'/gitlab-ui'}       | ${'src/foo.js'}
    ${'/gitlab-ui/src/foo.js'}      | ${'/gitlab-ui/'}      | ${'src/foo.js'}
    ${'gitlab-ui/src/foo.js'}       | ${'/gitlab-ui/'}      | ${'src/foo.js'}
    ${'/root/gitlab-ui/src/foo.js'} | ${'/root/gitlab-ui/'} | ${'src/foo.js'}
    ${'/gitlab-ui/src/foo.js'}      | ${'/bar/'}            | ${'/gitlab-ui/src/foo.js'}
  `('with (path=$path, root=$root), returns $result', ({ path, root, expectation }) => {
    const actual = stripPathRoot(path, root);

    expect(actual).toBe(expectation);
  });
});
