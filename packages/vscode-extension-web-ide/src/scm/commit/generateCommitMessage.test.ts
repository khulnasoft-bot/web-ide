import { FileStatusType } from '@khulnasoft/web-ide-fs';
import { generateCommitMessage } from './generateCommitMessage';

describe('scm/commit/generateCommitMessage', () => {
  it.each([
    {
      input: [],
      expected: 'Empty commit',
    },
    {
      input: [
        { type: FileStatusType.Modified, path: '/src/bar/foo.test.js', content: Buffer.from([]) },
      ],
      expected: 'Update file foo.test.js',
    },
    {
      input: [
        { type: FileStatusType.Modified, path: '/src/bar/foo.test.js', content: Buffer.from([]) },
        { type: FileStatusType.Modified, path: '/src/foo.md', content: Buffer.from([]) },
        { type: FileStatusType.Modified, path: '/README.md', content: Buffer.from([]) },
      ],
      expected: `Update 3 files

- /src/bar/foo.test.js
- /src/foo.md
- /README.md`,
    },
  ])('with $input.length status(es)', ({ input, expected }) => {
    expect(generateCommitMessage(input)).toBe(expected);
  });
});
