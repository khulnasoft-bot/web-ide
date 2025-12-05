/**
 * @overview Shared utilities for the `vscode-build` development scripts
 */

const path = require('path');

/** @description The filename for the local VSCode version metadata */
const FNAME_LOCAL_JSON = 'vscode_version.local.json';

const PATH_PROJECT_ROOT = path.dirname(__dirname);
const PATH_LOCAL_JSON = path.join(PATH_PROJECT_ROOT, FNAME_LOCAL_JSON);
const PATH_DIST = path.join(PATH_PROJECT_ROOT, 'dist');

/**
 * @typedef VscodeVersionType
 * @type {'path' | 'url'}
 * @description The "type" of the metadata used to locate the VSCode version
 */

/** @type VscodeVersionType */
const VSCODE_VERSION_TYPE_PATH = 'path';

module.exports = {
  FNAME_LOCAL_JSON,
  PATH_LOCAL_JSON,
  PATH_DIST,
  VSCODE_VERSION_TYPE_PATH,
};
