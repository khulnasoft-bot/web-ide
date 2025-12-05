const { renameDirectory, getPathtoVsCodeDir } = require('./_utils');

const VSCODE_DIR_PATH = getPathtoVsCodeDir();

const bundledNodeModulesPath = `${VSCODE_DIR_PATH}/bundled_node_modules`;
const nodeModulesPath = `${VSCODE_DIR_PATH}/node_modules`;

// why: renames bundled_node_modules back to node_modules
// node_modules was renamed to bundled_node_modules in the prepack step
renameDirectory(bundledNodeModulesPath, nodeModulesPath);
