#!/usr/bin/env bash

# See https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html
set -e # Abort script at first error, when a command exits with non-zero status (except in until or while loops, if-tests, list constructs)
set -u # Attempt to use undefined variable outputs error message, and forces an exit
set -o pipefail # Causes a pipeline to return the exit status of the last command in the pipe that returned a non-zero return value.

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$root_dir"

export VITE_HOST_PROTOCOL=vercel

embedder_url="/"
if [ -n "${VERCEL_PROJECT_PRODUCTION_URL:-}" ]; then
  embedder_url="https://${VERCEL_PROJECT_PRODUCTION_URL}"
elif [ -n "${VERCEL_URL:-}" ]; then
  embedder_url="https://${VERCEL_URL}"
fi

wildcard_domain="${VITE_VERCEL_WILDCARD_DOMAIN:-}"
wildcard_domain="${wildcard_domain#http://}"
wildcard_domain="${wildcard_domain#https://}"
wildcard_domain="${wildcard_domain#.}"
wildcard_domain="${wildcard_domain%/}"

if [ -n "$wildcard_domain" ]; then
  if [[ "$wildcard_domain" == *.vercel.app ]]; then
    echo "Error: VITE_VERCEL_WILDCARD_DOMAIN cannot use a *.vercel.app domain." >&2
    echo "Use a custom domain with wildcard DNS, or omit VITE_VERCEL_WILDCARD_DOMAIN to use single-origin mode." >&2
    exit 1
  fi

  export VITE_WORKBENCH_BASE_URL="https://workbench.${wildcard_domain}/web-ide/public"
  export VITE_EXTENSIONS_HOST_BASE_URL="https://{{uuid}}.${wildcard_domain}/web-ide/public/vscode"
  export VITE_CROSS_ORIGIN_EXTENSION_HOST=true
else
  export VITE_WORKBENCH_BASE_URL="web-ide/public"
  export VITE_EXTENSIONS_HOST_BASE_URL="web-ide/public/vscode"
  export VITE_CROSS_ORIGIN_EXTENSION_HOST=false
fi

export VITE_EMBEDDER_ORIGIN_URL="$embedder_url"

echo "Vercel build profile:"
echo "  VITE_HOST_PROTOCOL=${VITE_HOST_PROTOCOL}"
echo "  VITE_EMBEDDER_ORIGIN_URL=${VITE_EMBEDDER_ORIGIN_URL}"
echo "  VITE_WORKBENCH_BASE_URL=${VITE_WORKBENCH_BASE_URL}"
echo "  VITE_EXTENSIONS_HOST_BASE_URL=${VITE_EXTENSIONS_HOST_BASE_URL}"
echo "  VITE_CROSS_ORIGIN_EXTENSION_HOST=${VITE_CROSS_ORIGIN_EXTENSION_HOST}"

# why: The Vite environment is baked into the build. Remove the previous output so
# a profile change always triggers a rebuild.
rm -rf packages/example/dist

make packages/example
