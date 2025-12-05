const { NodeModulesPolyfillPlugin } = require('@esbuild-plugins/node-modules-polyfill');
const esbuild = require('esbuild');
const vscodeInfo = require('../packages/vscode-build/vscode_version.json');

module.exports = options =>
  esbuild
    .build({
      bundle: true,
      plugins: [NodeModulesPolyfillPlugin()],
      loader: {
        '.html': 'text',
      },
      external: ['vscode'],
      sourcemap: 'linked',
      /*
       * Based on gitlab project .browserslistrc file
       * https://gitlab.com/gitlab-org/gitlab/-/blob/master/.browserslistrc
       */
      target: ['chrome103', 'edge103', 'firefox102', 'safari15.6'],
      define: {
        /**
         * This define declarations will replace every
         * expression containing the reference to VSCodeInfo.commit
         * and VSCodeInfo.quality with the values extracted
         * from packages/vscode-build/vscode_version.json
         *
         * See the constant declaration in
         * packages/web-ide-types/src/global.d.ts
         */
        'VSCodeInfo.commit': `"${vscodeInfo.commit}"`,
        'VSCodeInfo.quality': `"${vscodeInfo.quality}"`,
      },
      ...options,
    })
    .catch(() => process.exit(1));
