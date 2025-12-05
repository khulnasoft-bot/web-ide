const { renameDirectory, getPathtoVsCodeDir } = require('./_utils');

const VSCODE_DIR_PATH = getPathtoVsCodeDir();
const bundledNodeModulesPath = `${VSCODE_DIR_PATH}/bundled_node_modules`;
const nodeModulesPath = `${VSCODE_DIR_PATH}/node_modules`;

// why: yarn pack ignores node_modules directory by default: https://github.com/yarnpkg/yarn/blob/master/src/cli/commands/pack.js#L23
// this step will be reverted when the package is installed (via postinstall hook)
renameDirectory(nodeModulesPath, bundledNodeModulesPath);
