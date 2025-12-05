import { getRefName } from './getRefName';

describe('utils/getRefName', () => {
  it.each`
    ref                                             | name
    ${{ type: 'branch', branch: { name: 'main' } }} | ${'main'}
    ${{ type: 'tag', name: 'v1.0.1' }}              | ${'v1.0.1'}
    ${{ type: 'commit', sha: 'abcdef12345678' }}    | ${'abcdef12'}
    ${{ type: 'commit', sha: 'abcdef' }}            | ${'abcdef'}
  `('with $ref, returns $name', ({ ref, name }) => {
    expect(getRefName(ref)).toBe(name);
  });
});
