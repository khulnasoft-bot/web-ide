import { resolvePathParams } from './resolvePathParams';

describe('resolvePathParams', () => {
  it.each`
    path                                       | params                                                                 | expectation
    ${''}                                      | ${{}}                                                                  | ${''}
    ${'/foo'}                                  | ${{}}                                                                  | ${'/foo'}
    ${'/foo/:id/bar'}                          | ${{}}                                                                  | ${'/foo/:id/bar'}
    ${'/foo/:id/bar'}                          | ${{ id: '123' }}                                                       | ${'/foo/123/bar'}
    ${'/foo/:id/bar/:id_test'}                 | ${{ id: '123' }}                                                       | ${'/foo/123/bar/:id_test'}
    ${'/foo/:id/bar/:id_2'}                    | ${{ id: '123', id_2: 'z' }}                                            | ${'/foo/123/bar/z'}
    ${'/foo/:projectId/bar'}                   | ${{ projectId: 'gitlab-org/gitlab' }}                                  | ${'/foo/gitlab-org%2Fgitlab/bar'}
    ${'/foo/:projectId/bar'}                   | ${{ projectId: 'gitlab-org/gitlab', ref: '000111', extra: '123&456' }} | ${'/foo/gitlab-org%2Fgitlab/bar?ref=000111&extra=123%26456'}
    ${'/foo/:projectId/bar/:(skipEncode)path'} | ${{ projectId: 'gitlab-org/gitlab', path: 'src/main.ts' }}             | ${'/foo/gitlab-org%2Fgitlab/bar/src/main.ts'}
    ${'/foo/:projectId/bar/:(dne)path'}        | ${{ projectId: 'gitlab-org/gitlab', path: 'src/main.ts' }}             | ${'/foo/gitlab-org%2Fgitlab/bar/src%2Fmain.ts'}
  `(
    'with path=$path and params=$params, should be $expectation',
    ({ path, params, expectation }) => {
      const actual = resolvePathParams(path, params);

      expect(actual).toBe(expectation);
    },
  );
});
