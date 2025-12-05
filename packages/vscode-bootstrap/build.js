require('../../scripts/build.base')({
  entryPoints: ['src/main.ts'],
  splitting: true,
  sourceRoot: './packages/vscode-bootstrap/src',
  outdir: 'dist',
  format: 'esm',
});
