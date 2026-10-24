#!/usr/bin/env bash

# See https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html
set -e # Abort script at first error, when a command exits with non-zero status (except in until or while loops, if-tests, list constructs)
set -u # Attempt to use undefined variable outputs error message, and forces an exit
set -o pipefail # Causes a pipeline to return the exit status of the last command in the pipe that returned a non-zero return value.

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$root_dir"

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "Error: VERCEL_TOKEN is required." >&2
  exit 1
fi

if [ -z "${VERCEL_ORG_ID:-}" ] || [ -z "${VERCEL_PROJECT_ID:-}" ]; then
  if [ ! -f .vercel/project.json ]; then
    echo "Error: Set VERCEL_ORG_ID and VERCEL_PROJECT_ID, or link the project with 'vercel link'." >&2
    exit 1
  fi
fi

pnpm dlx vercel@latest pull --yes --environment=production
pnpm dlx vercel@latest build --prod
pnpm dlx vercel@latest deploy --prebuilt --prod
