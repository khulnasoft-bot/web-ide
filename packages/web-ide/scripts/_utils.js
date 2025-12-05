const fs = require('fs');
const path = require('path');

function getPathtoVsCodeDir() {
  return path.resolve(__dirname, '../dist/public/vscode');
}

function renameDirectory(fromPath, toPath) {
  if (!fs.existsSync(fromPath)) {
    console.log('No directory found, skipping...');
    process.exit(0);
  }

  try {
    fs.renameSync(fromPath, toPath);
    console.log(`Successfully renamed "${fromPath}" to "${toPath}"`);
  } catch (err) {
    // Our only recoverable error is EXDEV. Fail immediately on anything else.
    if (err.code !== 'EXDEV') {
      console.error(`Error renaming directory: ${err}`);
      process.exit(1);
    }

    // If we failed to rename due to a EXDEV error, we're linking
    // across filesystems (e.g. layers in a docker image). Fallback
    // to recursive cp/rm instead.
    try {
      fs.cpSync(fromPath, toPath, { recursive: true });
    } catch (cpErr) {
      console.error(`Error removing original path after copy for rename: ${cpErr}`);
      process.exit(1);
    }
    try {
      fs.rmSync(fromPath, { recursive: true });
    } catch (rmErr) {
      console.error(`Error removing original path after copy for rename: ${rmErr}`);
      process.exit(1);
    }
    console.log(`Successfully moved "${fromPath}" to "${toPath}"`);
  }
}

module.exports = {
  renameDirectory,
  getPathtoVsCodeDir,
};
