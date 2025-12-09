#!/usr/bin/env bash

# See https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html
set -e # Abort script at first error, when a command exits with non-zero status (except in until or while loops, if-tests, list constructs)
set -u # Attempt to use undefined variable outputs error message, and forces an exit
set -o pipefail # Causes a pipeline to return the exit status of the last command in the pipe that returned a non-zero return value.

file_path="$(find tmp/packages -type f -name 'khulnasoft-vscode-theme*')"
file_name="$(basename $file_path)"
version="${file_name#khulnasoft-vscode-theme-}"
version="${version%.vsix}"

package_url="${CI_API_V4_URL}/projects/${KHULNASOFT_WEB_IDE_PROJECT_ID}/packages/generic/khulnasoft-vscode-theme/${version}/${file_name}"

curl --fail --header "JOB-TOKEN: ${CI_JOB_TOKEN}" --upload-file "${file_path}" "${package_url}"

git config user.name "${GITLAB_USER_NAME}"
git config user.email "${GITLAB_USER_EMAIL}"
git remote set-url origin https://gitlab-ci-token:${CI_JOB_TOKEN}@${CI_SERVER_HOST}/${CI_PROJECT_PATH}.git

git tag -a "${version}" -m "Version ${version}"
git push origin "${version}"

curl --fail --header 'Content-Type: application/json' --header "JOB-TOKEN: ${CI_JOB_TOKEN}" \
     --data "{ \"name\": \"GitLab VSCode Theme ${version}\", \"tag_name\": \"${version}\", \"assets\": { \"links\": [{ \"name\": \"${file_name}\", \"url\": \"${package_url}\" } ] } }" \
     --request POST "${CI_API_V4_URL}/projects/${KHULNASOFT_WEB_IDE_PROJECT_ID}/releases"
