---
stage: AI Clients
group: unassigned
info: To determine the technical writer assigned to the Stage/Group associated with this page, see https://about.gitlab.com/handbook/product/ux/technical-writing/#assignments
---

# GitLab for VS Code extension

The Web IDE includes [GitLab for VS Code](https://gitlab.com/gitlab-org/gitlab-vscode-extension) as
a built-in extension. This documentation provides guidance on how to test this extension in the Web IDE
during development.

## GitLab for VS Code package

The GitLab for VS Code extension is included as a release artifact managed by the
`packages/vscode-extension-gitlab-vscode-extension` package. By default, running `pnpm start:example`
will download and build the extension from the release version specified in the `gitlab_vscode_extension-version.json`.

The extension version is controlled by the JSON configuration file:

- `packages/vscode-extension-gitlab-vscode-extension/gitlab_vscode_extension_version.json` (default)
- `packages/vscode-extension-gitlab-vscode-extension/gitlab_vscode_extension_version.local.json` (for local development)

## Local Development

To test local changes to the GitLab for VS Code extension:

### Option 1: Using local extension files

1. **Run your extension in watch mode:**

   ```bash
   cd /path/to/your/gitlab-vscode-extension
   npm run watch:browser -- --webIde /path/to/your/gitlab-web-ide/packages/vscode-extension-gitlab-vscode-extension/dist/gitlab-vscode-extension/dist-browser
   ```

   - `--webIde` needs to be set only if your `gitlab-web-ide` is NOT located adjacent to `gitlab-vscode-extension`

2. **Create a local configuration:**

   ```bash
   # creates a packages/vscode-extension-gitlab-vscode-extension/gitlab_vscode_extension_version.local.json
   pnpm local-setup-gitlab-vscode-extension /path/to/your/gitlab-vscode-extension/dist-browser
   ```

3. **Start the Web IDE:**

   ```bash
   pnpm start:example
   ```

### Option 2: Using a specific branch or tag

To test changes from a specific branch or tag in the extension repository:

1. **Create a local configuration pointing to the branch:**

   ```json
   // packages/vscode-extension-gitlab-vscode-extension/gitlab_vscode_extension_version.local.json
   {
     "type": "url",
     "location": "https://gitlab.com/gitlab-org/gitlab-vscode-extension/-/archive/<branch-name>/gitlab-vscode-extension-<branch-name>.tar.gz"
   }
   ```

2. **Start the Web IDE:**

   ```bash
   pnpm start:example
   ```

### Iterating on local changes

When making changes to your local extension:

1. **Rebuild the extension:**

   ```bash
   cd /path/to/your/gitlab-vscode-extension
   npm run build:browser
   ```

2. **Restart the Web IDE:**

   ```bash
   pnpm start:example
   ```

## Switching between versions

### Return to release version

To switch back to using the official release version:

```bash
pnpm local-teardown-gitlab-vscode-extension
```

## GitLab Language Server

The GitLab for VS Code extension uses the
[GitLab Language Server](https://gitlab.com/gitlab-org/editor-extensions/gitlab-lsp) (gitlab-lsp) for features
like GitLab Duo Code Suggestions. In the Web IDE, the gitlab-lsp is disabled by default, and you can enable it
by setting the user configuration `gitlab.featureFlags.languageServerWebIDE` to `true`.
