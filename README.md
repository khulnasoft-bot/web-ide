# GitLab Web IDE

[**Example App**](https://gitlab-org.gitlab.io/khulnasoft-web-ide/) | [**Developer Guides**](./docs/README.md) | [**GitLab VS Code Extension**](https://gitlab.com/gitlab-org/khulnasoft-vscode-extension)

## What is this?

This project builds the [`@khulnasoft/web-ide` npm package](https://www.npmjs.com/package/@khulnasoft/web-ide), used in the [main GitLab project](https://gitlab.com/gitlab-org/gitlab) to bootstrap GitLab's context-aware Web IDE.

## How to use the example?

Visit [the Pages Deployment](https://gitlab-org.gitlab.io/khulnasoft-web-ide/) or run the example locally with `yarn start:example`. See detailed instructions [here](./docs/contributing/development-environment-setup.md#Setup).

1. Fill out the startup configuration form, or accept the default values:

   | Field        | Value                   |
   | ------------ | ----------------------- |
   | Type         | `Client only (Default)` |
   | GitLab URL   | `https://gitlab.com`    |
   | Project Path | `gitlab-org/gitlab`     |
   | Ref          | `master`                |

2. Click **Start GitLab Web IDE**

## How to contribute?

Check out the [developer docs](./docs/README.md).
