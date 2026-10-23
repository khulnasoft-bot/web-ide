#!/bin/bash

set -o errexit # AKA -e - exit immediately on errors (http://mywiki.wooledge.org/BashFAQ/105)
set -o pipefail # fail when pipelines contain an error (see http://www.gnu.org/software/bash/manual/html_node/Pipelines.html)
# set -o xtrace # AKA -x - get bash "stacktraces" and see where this script failed
#
# this only works when the submodule is up to date, when there are changes, the first character of the output is a `+`
SUBMODULE_SHA="$(git submodule | awk '{print $1}')"
TARGET_TAG="$(cd gitlab-vscode-extension && git tag --points-at "$SUBMODULE_SHA")"

echo "Checking SHA ${SUBMODULE_SHA} ... and TAG: ${TARGET_TAG}"

PIPELINES_FOR_SHA=$(curl "https://gitlab.com/api/v4/projects/gitlab-org%2Fgitlab-vscode-extension/pipelines?scope=finished&sha=${SUBMODULE_SHA}")
TAG_INFO=$(curl "https://gitlab.com/api/v4/projects/gitlab-org%2Fgitlab-vscode-extension/repository/tags/${TARGET_TAG}")

TAG_FOUND=$(jq '(.release != null)' <<< "$TAG_INFO")
PIPELINE_FOUND=$(jq '. | length > 0' <<< "$PIPELINES_FOR_SHA")

FAILURE_MESSAGE="Ensure that the SHA is tagged and that it has a successful pipeline in the gitlab-vscode-extesnion project."

if [ "$TAG_FOUND" == "true" ]; then
  echo "Found a matching tag with a release, checking pipeline status for submodule SHA $SUBMODULE_SHA"
else
  echo "Tag not found for submodule SHA (${SUBMODULE_SHA})"
  echo "$FAILURE_MESSAGE"
  return 1
fi

if [ "$PIPELINE_FOUND" == "true" ]; then
  echo "found successful tag pipeline for the submodule sha 🎉"
else
  echo "The submodule SHA (${SUBMODULE_SHA}) doesn't have a successful pipeline associated with it."
  echo "$FAILURE_MESSAGE"
  return 1
fi
