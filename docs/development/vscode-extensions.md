---
stage: Create
group: remote development
info: To determine the technical writer assigned to the Stage/Group associated with this page, see https://about.gitlab.com/handbook/product/ux/technical-writing/#assignments
---

# Working with VS Code extensions

## Adding built-in language support extension

1. [Create a new package](./working-with-packages.md) based off of the `vscode-extension-language-support-vue` package.
1. Add build instructions to the `Makefile` so that the extension is included in the main `web-ide` package.
   Look for references to `vscode-extension-language-support-vue` to copy.
1. Add a reference to the new extension in the VSCode bootstrapper
   (see [relevant code](https://gitlab.com/gitlab-org/gitlab-web-ide/-/blob/deec8349cde45a1b8292445fd425d232c63c2db3/packages/vscode-bootstrap/src/main.ts#L40)).

**PLEASE NOTE:**

- Having a bunch of built-in extensions that need to be loaded on start isn't great.
  There might be ways we could optimize these into just 1 extension while keeping separate packages
  for cohesion.
- Supporting the extension marketplace is the preferred approach to providing language support.
  See [this relevant issue](https://gitlab.com/gitlab-org/gitlab/-/issues/355092).
