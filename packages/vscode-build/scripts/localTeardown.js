/**
 * @overview Development script to clean up the environment created by `localSetup`.
 *
 * ```
 * yarn local-teardown
 * ```
 */

const fs = require('fs/promises');
const { PATH_LOCAL_JSON, FNAME_LOCAL_JSON, PATH_DIST } = require('./_utils');

const main = async () => {
  console.log(`
Trying to remove "${FNAME_LOCAL_JSON}"...`);

  try {
    await fs.rm(PATH_LOCAL_JSON);
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log(`"${FNAME_LOCAL_JSON}" does not exist. That's okay :)`);
    } else {
      console.log(`ERROR: Something bad happened while trying to remove "${FNAME_LOCAL_JSON}"!`);
      throw e;
    }
  }
  console.log('DONE!');

  console.log(`
Trying to remove "dist"...
This will make sure we redownload vscode the next time make runs.`);

  try {
    await fs.rm(PATH_DIST, { recursive: true });
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.log(`ERROR: Something bad happened while trying to remove "${PATH_DIST}"!`);
      throw e;
    }
  }

  console.log('DONE!');
};

main();
