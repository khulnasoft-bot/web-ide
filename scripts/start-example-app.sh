#!/usr/bin/env bash

# See https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html
set -e # Abort script at first error, when a command exits with non-zero status (except in until or while loops, if-tests, list constructs)
set -u # Attempt to use undefined variable outputs error message, and forces an exit
set -o pipefail # Causes a pipeline to return the exit status of the last command in the pipe that returned a non-zero return value.

# ANSI color codes
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# NOTE: Touch the .env.local to trick Makefile into treating the example app as stale
root_dir="$(dirname $(dirname $(readlink -f $0)))"
touch $root_dir/config/.env.local

export VITE_HOST_PROTOCOL=${VITE_HOST_PROTOCOL:-'https'}

start_server() {
  echo -e "${YELLOW}Starting Web IDE's example server.${NC}"

  if [ "${VITE_HOST_PROTOCOL}" == "https" ]; then
    echo -e "${GREEN}Use the following URL to access the Web IDE: ${VITE_HOST_PROTOCOL}://${IDE_HOST_MAIN_DOMAIN}:8000${NC}"
  fi

  concurrently "yarn:watch:example" "yarn:serve:example:${VITE_HOST_PROTOCOL}"
}

generate_tls_certificates() {
  local start_server_command=$1

  # Do not generate TLS certificates if running in HTTP mode
  if [ "${VITE_HOST_PROTOCOL}" == "http" ]; then
    echo -e "${GREEN} Skipping certificate checks because the Web IDE is running in HTTP mode"
    eval "$start_server_command"
    return 0
  fi

  # Check if TLS certificate files exist
  if [ -f "${IDE_CERT_FILE}" ] && [ -f "${IDE_KEY_FILE}" ]; then
    echo -e "${GREEN}Found existing TLS certificates for the Web IDE example server. Starting...${NC}"
    eval "$start_server_command"
  else
    echo -e "${YELLOW}Could not find TLS certificates for the Web IDE example server.${NC}"

    # Check if mkcert is available
    if ! command -v mkcert &>/dev/null; then
      echo -e "${RED}Error: The Web IDE test server requires 'mkcert' to generate TLS certificates${NC}"
      echo -e "${RED}Please install mkcert and try again${NC}"
      exit 1
    fi

    echo -e "${YELLOW}Generating TLS certificates...${NC}"
    mkcert -cert-file "${IDE_CERT_FILE}" -key-file "${IDE_KEY_FILE}" "${IDE_HOST_BASE_DOMAIN}"

    # Verify certificates were created successfully
    if [ -f "${IDE_CERT_FILE}" ] && [ -f "${IDE_KEY_FILE}" ]; then
      echo -e "${GREEN}Certificates generated successfully${NC}"
      eval "$start_server_command"
    else
      echo -e "${RED}Error: Failed to generate certificates${NC}"
      exit 1
    fi
  fi
}

generate_tls_certificates "${1:-'start_server'}"
