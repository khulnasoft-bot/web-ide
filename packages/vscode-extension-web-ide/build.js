require('../../scripts/build.base')({
  entryPoints: ['src/main.ts'],
  sourceRoot: './packages/vscode-extension-web-ide/src',
  outdir: 'dist',
  format: 'cjs',
});
