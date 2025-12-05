export const REPO_ROOT = 'test-repo';

export const DEFAULT_FILE_ARRAY = [
  {
    path: 'README.md',
    content: 'Lorem ipsum dolar sit\namit\n\n# Title\n123456\n',
    mode: '100644',
  },
  {
    path: 'foo/bar/index.js',
    content: 'console.log("Hello world!")\n',
    mode: '100655',
  },
  {
    path: 'foo/README.md',
    content: '# foo\n\nIt has foos.\n',
    // NOTE: If the mode doesn't start with 100, it will cause issues because `.stat` will return
    //       something that is false for both `.isFile()` and `.isDirectory()`
    // TODO: Investigate if we need to cover other kinds of `mode`
    mode: '100555',
  },
  {
    path: 'tmp/.gitkeep',
    content: '',
    mode: '100644',
  },
];

export const DEFAULT_FILES: Record<string, string> = DEFAULT_FILE_ARRAY.reduce(
  (acc, x) => Object.assign(acc, { [x.path]: x.content }),
  {},
);
