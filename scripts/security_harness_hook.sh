#!/bin/bash
# ===============
# This file originated from
# https://gitlab.com/gitlab-org/gitlab-vscode-extension/-/blob/c7ae7fca6269918c718466a61a60fb9d4ffadd79/scripts/security_harness_hook.sh
# ===============

set -e

url="$2"

if [[ "$url" != *"gitlab-org/security/"* ]]
then
  echo "Pushing to remotes other than gitlab.com/gitlab-org/security has been disabled!"
  echo "Run scripts/security_harness to disable this check."
  echo

  exit 1
fi
