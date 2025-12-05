import { createSetOfAllPaths } from './createSetOfAllPaths';

describe('utils/createSetOfAllPaths', () => {
  it.each<[{ input: string[]; expectation: string[] }]>([
    [
      {
        input: [],
        expectation: [],
      },
    ],
    [
      {
        input: ['README.md'],
        expectation: ['README.md'],
      },
    ],
    [
      {
        input: ['/README.md', '/foo/bar/test.js', '/foo/docs/lorem/ipsum/test.md', '/foo/docs'],
        expectation: [
          '/README.md',
          '/foo',
          '/foo/bar',
          '/foo/bar/test.js',
          '/foo/docs',
          '/foo/docs/lorem',
          '/foo/docs/lorem/ipsum',
          '/foo/docs/lorem/ipsum/test.md',
        ],
      },
    ],
  ])('creates set including all paths and parent paths %#', ({ input, expectation }) => {
    const actual = createSetOfAllPaths(input);

    expect(actual).toEqual(new Set(expectation));
  });
});
