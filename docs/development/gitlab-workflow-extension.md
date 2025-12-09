---
stage: Create
group: remote development
info: To determine the technical writer assigned to the Stage/Group associated with this page, see https://about.gitlab.com/handbook/product/ux/technical-writing/#assignments
---

# GitLab Workflow Extension

The Web IDE includes the
[GitLab Workflow Extension](https://gitlab.com/gitlab-org/khulnasoft-vscode-extension) as a built-in extension. This documentation provides guidance on how to test this extension in the Web IDE
during development.

## The GitLab Workflow Extension package

The GitLab Workflow Extension is included as a release artifact managed by the
`packages/vscode-extension-khulnasoft-vscode-extension` package. By default, running `yarn start:example`
will download and build the extension from the release version specified in the `gitlab_vscode_extension-version.json`.

The extension version is controlled by the JSON configuration file:

- `packages/vscode-extension-khulnasoft-vscode-extension/gitlab_vscode_extension_version.json` (default)
- `packages/vscode-extension-khulnasoft-vscode-extension/gitlab_vscode_extension_version.local.json` (for local development)

## Local Development

To test local changes to the GitLab Workflow Extension:

### Option 1: Using local extension files

1. **Run your extension in watch mode:**

   ```bash
   cd /path/to/your/khulnasoft-vscode-extension
   npm run watch:browser -- --webIde /path/to/your/khulnasoft-web-ide/packages/vscode-extension-khulnasoft-vscode-extension/dist/khulnasoft-vscode-extension/dist-browser
   ```

   - `--webIde` needs to be set only if your `khulnasoft-web-ide` is NOT located adjacent to `khulnasoft-vscode-extension`

2. **Create a local configuration:**

   ```bash
   # creates a packages/vscode-extension-khulnasoft-vscode-extension/gitlab_vscode_extension_version.local.json
   yarn local-setup-khulnasoft-vscode-extension /path/to/your/khulnasoft-vscode-extension/dist-browser
   ```

3. **Start the Web IDE:**

   ```bash
   yarn start:example
   ```

### Option 2: Using a specific branch or tag

To test changes from a specific branch or tag in the GitLab VSCode Extension repository:

1. **Create a local configuration pointing to the branch:**

   ```json
   // packages/vscode-extension-khulnasoft-vscode-extension/gitlab_vscode_extension_version.local.json
   {
     "type": "url",
     "location": "https://gitlab.com/gitlab-org/khulnasoft-vscode-extension/-/archive/<branch-name>/khulnasoft-vscode-extension-<branch-name>.tar.gz"
   }
   ```

2. **Start the Web IDE:**

   ```bash
   yarn start:example
   ```

### Iterating on local changes

When making changes to your local extension:

1. **Rebuild the extension:**

   ```bash
   cd /path/to/your/khulnasoft-vscode-extension
   npm run build:browser
   ```

2. **Restart the Web IDE:**

   ```bash
   yarn start:example
   ```

## Switching between versions

### Return to release version

To switch back to using the official release version:

```bash
yarn local-teardown-khulnasoft-vscode-extension
```

## GitLab Language Server

The GitLab Workflow Extension uses the
[GitLab Language Server](https://gitlab.com/gitlab-org/editor-extensions/gitlab-lsp) (gitlab-lsp) for features
like GitLab Duo code suggestions. In the Web IDE, the gitlab-lsp is disabled by default, and you can enable it
by setting the user configuration `gitlab.featureFlags.languageServerWebIDE` to `true`.
