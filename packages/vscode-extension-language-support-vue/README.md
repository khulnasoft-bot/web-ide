# packages/vscode-extension-language-support-vue

This package provides basic Vue language support based on the [vetur] VSCode extension.

## Source

From [vetur@v0.37.3](https://github.com/vuejs/vetur/tree/v0.37.3):

- From Vetur's `package.json`, the following properties are pulled and inserted into this package's `vscode.package.json`:
  - `contributes.languages`
  - `contributes.grammars`
  - `contributes.semanticTokenScopes`
- From Vetur's `languages/` directory, the contents are included in this package's `assets/vetur/languages`.
- From Vetur's `syntaxes/` directory, the contents are included in this package's` assets/vetur/syntaxes`.
