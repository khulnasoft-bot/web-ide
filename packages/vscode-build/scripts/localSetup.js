/**
 * @overview Development script to trigger the `make` for `vscode-build` to use a `vscode_version.local.json`.
 *
 * ```
 * yarn local-setup $PATH_TO_VSCODE_FORK_BUILD_DIR
 * ```
 */
const fs = require('fs/promises');
const { PATH_LOCAL_JSON, FNAME_LOCAL_JSON, VSCODE_VERSION_TYPE_PATH } = require('./_utils');

const EXPECTED_LOCAL_LOCATION_REGEX = /^[/\\].*[/\\].build[/\\]vscode-web[/\\]?$/;
const EXPECTED_LOCAL_LOCATION_SUFFIX = '.build/vscode-web';

/**
 * @param {String} path - Used as the "location" for the local VSCode version metadata
 * @returns {String} JSON formatted string of content to be written to the local VSCode version metadata file
 */
const getLocalVSCodeVersionContents = path => {
  const json = {
    type: VSCODE_VERSION_TYPE_PATH,
    location: path,
  };

  return JSON.stringify(json, undefined, 2);
};

const main = async () => {
  const path = process.argv[2]?.trim();

  if (!path) {
    console.log(`
Please provide a path for the local vscode build.
For example:

   yarn local-setup /absolute/path/to/gitlab-web-ide-vscode-fork/.build/vscode-web
`);
    process.exit(1);
    return;
  }

  // what: Let's test the path, and politely warn the user if something seems off.
  if (!EXPECTED_LOCAL_LOCATION_REGEX.test(path)) {
    console.log(`
WARNING: The path provided doesn't match what we were expecting.

  - Expected absolute path.
  - Expected path ending with "${EXPECTED_LOCAL_LOCATION_SUFFIX}"

This might be okay. You should verify that the path you provided is what you intended.`);
  }

  const content = getLocalVSCodeVersionContents(path);

  console.log(`
Writing to "${FNAME_LOCAL_JSON}" with given path "${path}"...`);
  try {
    await fs.writeFile(PATH_LOCAL_JSON, content, 'utf8');
  } catch (e) {
    console.log(`ERROR: Something bad happened while trying to write to "${PATH_LOCAL_JSON}".`);
    throw e;
  }

  console.log('DONE!');
};

main();
