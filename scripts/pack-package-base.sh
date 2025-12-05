#!/usr/bin/env bash

# See https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html
set -e # Abort script at first error, when a command exits with non-zero status (except in until or while loops, if-tests, list constructs)
set -u # Attempt to use undefined variable outputs error message, and forces an exit
set -o pipefail # Causes a pipeline to return the exit status of the last command in the pipe that returned a non-zero return value.

CURRENT_VERSION=$(cat VERSION)
GITLAB_WEB_IDE_VERSION="${1:-}"

if [ -z "${GITLAB_WEB_IDE_VERSION}" ]
then
  GITLAB_WEB_IDE_VERSION="$(cat VERSION)-dev-$(date '+%Y%m%d%H%M%S')"
  echo "No version was provided as argument. Using development version ${GITLAB_WEB_IDE_VERSION}..."
else
  if [[ $GITLAB_WEB_IDE_VERSION != "${CURRENT_VERSION}"* ]]
  then
    echo "Error: Version provided (${GITLAB_WEB_IDE_VERSION}) must start with the current version (${CURRENT_VERSION})."
    exit 1
  else
    echo "Using version ${GITLAB_WEB_IDE_VERSION}..."
  fi
fi

