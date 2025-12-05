#!/usr/bin/env bash

# See https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html
set -e # Abort script at first error, when a command exits with non-zero status (except in until or while loops, if-tests, list constructs)
set -u # Attempt to use undefined variable outputs error message, and forces an exit
set -o pipefail # Causes a pipeline to return the exit status of the last command in the pipe that returned a non-zero return value.

root_dir="$(dirname $(dirname $(readlink -f $0)))"
tmp_dir=$root_dir/tmp/packages

source "${root_dir}/scripts/pack-package-base.sh"

mkdir -p $tmp_dir

echo "Pack: Packing gitlab-vscode-theme package with version ${GITLAB_WEB_IDE_VERSION}..."
yarn workspace gitlab-vscode-theme version "${GITLAB_WEB_IDE_VERSION}"
yarn workspace gitlab-vscode-theme package -o $tmp_dir
