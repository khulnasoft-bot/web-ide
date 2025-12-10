#!/bin/bash

# Usage:
# ```
# ./scripts/save-web-ide-security-patch.sh ./packages/web-ide-copy
# ```
# 
# This script is for updating `same_origin_security.patch` which will likely
# need to happen whenever the base VSCode version is updated.
# 
# To update the patch, here's a process to follow:
# 
# 1. Start by building the whole project, mainly the `web-ide` package:  
#    
#    ```
#    yarn clean && pnpm run build:example
#    ```
# 2. Copy the `./packages/web-ide` to `./tmp`:
#
#    ```
#    cp -r ./packages/web-ide ./tmp
#    ```
# 3. Make whatever changes necessary in the `./tmp/web-ide/dist/vscode` directory.
#    These changes will likely include removing some `.html` files. Refer to the 
#    existing patch for expected changes. You can use the following script to find
#    `.html` files:
#    
#    ```
#    cd ./tmp/web-ide
#    find ./dist -type f -name '*.html'
#    ```
# 4. Run this script, passing in the path to the **copied** and **modified** `web-ide`:
#    
#    ```
#    ./scripts/save-web-ide-security-patch.sh ./tmp/web-ide
#    ```

# Check if the directory argument is provided
if [ $# -eq 0 ]; then
    echo "Error: Please provide the directory path as an argument."
    echo "Usage: $0 <directory_path>"
    exit 1
fi

# Set the directory path
WEB_IDE_COPY_PATH="$1"

# Check if the directory exists
if [ ! -d "$WEB_IDE_COPY_PATH" ]; then
    echo "Error: Directory '$WEB_IDE_COPY_PATH' does not exist."
    exit 1
fi

WEB_IDE_COPY_DIST_PATH="$WEB_IDE_COPY_PATH/dist"
WEB_IDE_PATH="./packages/web-ide"
WEB_IDE_DIST_PATH="$WEB_IDE_PATH/dist"
WEB_IDE_PATCH_PATH="$WEB_IDE_PATH/same_origin_security.patch"

# Check that bundled_node_modules is not present in $WEB_IDE_PATH
# why: This happens if `prepack` fails, which will happen if the patch doesnt apply, so it's worth checking.
if [ -d "$WEB_IDE_DIST_PATH/public/vscode/bundled_node_modules" ]; then
    echo "Error: bundled_node_modules is present in $WEB_IDE_PATH. This will cause the diff to blow up so we're stopping now, before its too late."
    echo "To fix this, try running 'yarn clean && yarn build:example'."
    exit 1
fi


echo "Diffing $WEB_IDE_DIST_PATH $WEB_IDE_COPY_DIST_PATH to generate patch..."
diff -uNr $WEB_IDE_DIST_PATH $WEB_IDE_COPY_DIST_PATH > $WEB_IDE_PATCH_PATH

echo "Cleaning up patch..."
# Process the patch file
#     -e 's|^(diff -uNr )\./packages/web-ide/|\1|' \
sed -E \
    -e "s|^(--- )${WEB_IDE_PATH}/|\1|" \
    -e "s|^(\+\+\+ )${WEB_IDE_PATH}/|\1|" \
    -e "s|^(--- )${WEB_IDE_COPY_PATH}/|\1|" \
    -e "s|^(\+\+\+ )${WEB_IDE_COPY_PATH}/|\1|" \
    "$WEB_IDE_PATCH_PATH" > "$WEB_IDE_PATCH_PATH.temp"

mv "$WEB_IDE_PATCH_PATH.temp" "$WEB_IDE_PATCH_PATH"
