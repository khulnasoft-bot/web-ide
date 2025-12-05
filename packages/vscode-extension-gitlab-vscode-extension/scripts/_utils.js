/**
 * @overview Shared utilities for the `vscode-extension-gitlab-vscode-extension` development scripts
 */

const path = require('path');

/** @description The filename for the local extension version metadata */
const FNAME_LOCAL_JSON = 'gitlab_vscode_extension_version.local.json';

const PATH_PROJECT_ROOT = path.dirname(__dirname);
const PATH_LOCAL_JSON = path.join(PATH_PROJECT_ROOT, FNAME_LOCAL_JSON);
const PATH_DIST = path.join(PATH_PROJECT_ROOT, 'dist');

/**
 * @typedef ExtensionVersionType
 * @type {'path' | 'url'}
 * @description The "type" of the metadata used to locate the extension version
 */

/** @type ExtensionVersionType */
const EXTENSION_VERSION_TYPE_PATH = 'path';

module.exports = {
  FNAME_LOCAL_JSON,
  PATH_LOCAL_JSON,
  PATH_DIST,
  EXTENSION_VERSION_TYPE_PATH,
};
