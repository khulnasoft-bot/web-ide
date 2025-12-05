import { splitParent } from './splitParent';

describe('utils/path/splitParent', () => {
  it.each`
    input          | parent        | name
    ${''}          | ${null}       | ${''}
    ${'file'}      | ${null}       | ${'file'}
    ${'foo/file'}  | ${'foo'}      | ${'file'}
    ${'foo/file/'} | ${'foo/file'} | ${''}
  `(
    'with $input, returns [$parent, $name]',
    ({ input, parent, name }: { input: string; parent: string | null; name: string }) => {
      expect(splitParent(input)).toEqual([parent, name]);
    },
  );
});
