#!/usr/bin/env bash

# See https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html
set -e # Abort script at first error, when a command exits with non-zero status (except in until or while loops, if-tests, list constructs)
set -u # Attempt to use undefined variable outputs error message, and forces an exit
set -o pipefail # Causes a pipeline to return the exit status of the last command in the pipe that returned a non-zero return value.

root_dir="$(dirname $(dirname $(readlink -f $0)))"

source "${root_dir}/scripts/pack-package-base.sh"

DEST_DIR="$PWD/tmp/packages"
NPM_PACKAGE_PATH="$DEST_DIR/khulnasoft-web-ide-npm-$KHULNASOFT_WEB_IDE_VERSION.tgz"
WORKBENCH_PACKAGE_PATH="$DEST_DIR/khulnasoft-web-ide-vscode-workbench-$KHULNASOFT_WEB_IDE_VERSION"

echo "Build: Building @khulnasoft/web-ide package..."
yarn run build:webide

echo "Pre-pack: Setting @khulnasoft/web-ide version to ${KHULNASOFT_WEB_IDE_VERSION}..."
yarn workspace @khulnasoft/web-ide version ${KHULNASOFT_WEB_IDE_VERSION}

# why backup package.json: We need to clean up a @khulnasoft/web-ide-types which is only used for compiling.
# We are not publishing @khulnasoft/web-ide-types package, so releasing references to this
# could cause problems...
# For this reason, let's copy off the existing package.json so we can remove this dependency
# before packing.
echo "Pre-pack: Saving backup package.json..."
cp packages/web-ide/package.json{,.bak}

# region: Clean and optimize package -----------------------------------

echo "Pre-pack (clean): Cleaning package.json for publish..."
BUNDLED_PACKAGES=$(node scripts/echo-workspace-dependencies.js packages/web-ide/package.json)
yarn workspace @khulnasoft/web-ide remove ${BUNDLED_PACKAGES}

# why: https://gitlab.com/gitlab-org/gitlab/-/merge_requests/95169#note_1064410338
echo "Pre-pack (clean): Remove .map files to improve artifact size"
find packages/web-ide/dist/public -name '*.js.map' -delete

# region: Pack ---------------------------------------------------------
mkdir -p tmp/packages

echo "Pack: Packing @khulnasoft/web-ide package..."
yarn workspace @khulnasoft/web-ide pack --out "$NPM_PACKAGE_PATH"

echo "Pack: Packing khulnasoft-web-ide-vscode-workbench package..."
cp -r "packages/web-ide/dist/public" "$WORKBENCH_PACKAGE_PATH"
# why: node_modules is renamed to `bundled_node_modules` so we can include it in the NPM package.
# We need to revert this change for the workbench artifact that is released independently of the NPM package.
mv "$WORKBENCH_PACKAGE_PATH/vscode/bundled_node_modules" "$WORKBENCH_PACKAGE_PATH/vscode/node_modules"

tar -cvf "$WORKBENCH_PACKAGE_PATH.tgz" -C "$WORKBENCH_PACKAGE_PATH" .

# region: Teardown -----------------------------------------------------

echo "Teardown: Restoring old package.json"
rm packages/web-ide/package.json
mv packages/web-ide/package.json{.bak,}
# why --no-immutable: This will be mutable since we're resurrecting a removed workspace dependency
yarn --no-immutable

# region: Verify -------------------------------------------------------
# TODO: Read package.json and verify no workspace dependencies
