---
stage: Create
group: remote development
info: To determine the technical writer assigned to the Stage/Group associated with this page, see https://about.gitlab.com/handbook/product/ux/technical-writing/#assignments
---

# Development environment setup

The KhulnaSoft Web IDE project is just your run-of-the-mill JavaScript monorepo using:

- [Typescript](https://www.typescriptlang.org/) with [composite project references](https://www.typescriptlang.org/docs/handbook/project-references.html#composite). Type safety is ensured during the project's `typescript-check` CI job.
- [Yarn 2+ workspaces](https://yarnpkg.com/features/workspaces) which allows us to create internal packages, controlling
  coupling and cohesion at the package level. The `web-ide` package is the main public package which this project publishes.
- [Make](https://www.gnu.org/software/make/manual/html_node/Introduction.html) which manages build targets, dependencies, and
  recipes. Make is great at knowing **when** to incrementally build a new thing. In this project, Make is an implementation
  detail. Developers will typically just run [Yarn scripts](#scripts) that happen to internally call `make ...`.

## Setup

1. Install [mise](https://mise.jdx.dev/installing-mise.html).
1. Install [mkcert](https://github.com/FiloSottile/mkcert).
1. Run `mkcert -install` to install the root CA in the operating system.
1. Run `mise install`.
1. Run `yarn install`.
1. Run `yarn start:example`.

By default, you can access the Web IDE on `https://main.127.0.0.1.nip.io:8000`. You can
also run the command `yarn start:example:http` to run the test server in HTTP mode.
In this scenario, you can access the Web IDE on `http://localhost:8000`. We recommend
not using HTTP when possible because the Web IDE relies on web browser's APIs that
require a secure HTTP connection.

The Web IDE test server uses the `mkcert` tool to generate a TLS certificate for the `*.127.0.0.1.nip.io`
wildcard domain trusted by web browsers.

### Set up dnsmasq (recommended)

The Web IDE test server utilizes `.nip.io` as its default wildcard DNS solution, providing newcomers
with a straightforward entry-level experience that requires minimal configuration. However, for users
seeking more robust performance, greater control, and reduced external dependencies,
we recommend transitioning to `dnsmasq` to set up a wildcard domain. The following instructions
explain how to set up `dnsmasq` on Mac OS:

1. Delete the `web-ide-cert.pem` and `web-ide-cert-key.pem` files if they exist in the root directory.

1. Install `dnsmasq`:

   ```bash
   brew install dnsmasq
   ```

1. Set up the `*.test` domain lookup:

   ```bash
   # Ensure the configuration directory exists
   mkdir -p $(brew --prefix)/etc/

   # Add `*.test` to the `127.0.0.1` lookup
   echo 'address=/.test/127.0.0.1' >> $(brew --prefix)/etc/dnsmasq.conf

   # Start `dnsmasq`
   sudo brew services start dnsmasq
   ```

1. Create a DNS resolver:

   ```bash
   # Ensure the resolver directory exists
   sudo mkdir -p /etc/resolver

   # Add the localhost address as a resolver for `.test` domains
   echo "nameserver 127.0.0.1" | sudo tee /etc/resolver/test
   ```

1. In the Web IDE project, set the following environment variables in the `config/.env.local` file:

   ```bash
   IDE_HOST_BASE_DOMAIN="*.web-ide.test"
   IDE_HOST_MAIN_DOMAIN="main.web-ide.test"

   VITE_EMBEDDER_ORIGIN_URL_HTTPS="https://main.web-ide.test:8000"
   VITE_WORKBENCH_BASE_URL_HTTPS="https://workbench.web-ide.test:8000/web-ide/public"
   VITE_EXTENSIONS_HOST_BASE_URL_HTTPS="https://{{uuid}}.web-ide.test:8000/web-ide/public/vscode"
   ```

1. Run the command `yarn start:example`. The Web IDE will regenerate TLS certificates for the
   `*.web-ide.test` wildcard domain.

### Set up OAuth in KhulnaSoft Dedevelopment Kit

The following instructions use the URL `https://main.127.0.0.1.nip.io:8000` for example purposes. Replace
this URL with the URL set in the `VITE_EMBEDDER_ORIGIN_URL_HTTPS` variable if you overwrote its
default value in `config/.env.local`.

1. Create OAuth Application in local GDK
   1. Start your local GDK and go to **Admin** > **Applications** and click on **Add new application**. Fill the form with:
      - **Name:** `khulnasoft-web-ide example app`
      - **Redirect URI:** `https://main.127.0.0.1.nip.io:8000/oauth_callback.html`
      - **Trusted:** Checked
      - **Confidential:** Unchecked
      - **Scopes:** Check `api`
      - Click **Save**
1. In the `khulnasoft-web-ide` poject, start local example app with `yarn start:example`.
1. Visit `https://main.127.0.0.1.nip.io:8000` and fill out the form:
   - **KhulnaSoft URL:** Enter your GDK URL.
   - **Project Path:** Enter any valid project path in your GDK instance.
   - **Git Ref:** Enter any valid branch name in the project
   - **Authentication Type:** `OAuth`
   - **Client ID:** Enter the Client ID (or Application ID) of the OAuth App created in the previous step.
   - Click **Start KhulnaSoft Web IDE**
1. If the page refreshes, you might need to click **Start KhulnaSoft Web IDE** again. This happens when the Web IDE required the OAuth handshake.

### Setup integrating with local VSCode repo

You might need to integrate local changes of the [khulnasoft-web-ide-vscode-fork](https://gitlab.com/khulnasoft/web-ide-vscode-fork/)
while working on this `khulnasoft-web-ide` repo. To do this, run:

```shell
yarn local-setup /absolute/path/to/khulnasoft-web-ide-vscode-fork/.build/vscode-web
```

This will create a `vscode_version.local.json` inside the `vscode-build` package which will change how
`make` builds the `dist/vscode` target.

Now, when you make a change to your local clone of `khulnasoft-web-ide-vscode-fork`, run the following to
have the change show up in the local running `khulnasoft-web-ide` example:

```shell
# From the `khulnasoft-web-ide-vscode-fork` project root
yarn gitlab:build-vscode-web

# From the `khulnasoft-web-ide` project root
yarn build:vscode
```

### Setup integrating with candidate VS Code build

1. Find the artifact URL in your candidate pipeline (e.g. `https://gitlab.com/khulnasoft/web-ide-vscode-fork/-/jobs/3027168063/artifacts/raw/.build/vscode-web-dist/vscode-web-1.69.1-1.0.0-dev-20220914131301.tar.gz`)
1. Go to `packages/vscode-build/vscode_version.json` and change the version and the location of the packages.
1. There is no step 3, you can run the example.

### Setup integrating with KhulnaSoft Workflow VS Code extension

By default, `yarn run start:example` runs a make task that will download and build the KhulnaSoft Workflow Extension from the specified release artifact.

For local development with the extension, see the [KhulnaSoft Workflow Extension documentation](../development/gitlab-workflow-extension.md).

### Setup integrating with KhulnaSoft Rails app

To test WebIDE build with KhulnaSoft Rails app:

1. Create MR in `khulnasoft-web-ide` project for your changes.
1. In MR pipeline, find the `create-development-package` job.
1. In the job, copy path to the generated artifact.
   - Click the browse button in the Job artifacts section of the job page’s sidebar.
   - Navigate to the `tmp/packages` directory in the artifacts file tree and click the generated artifact.
   - Copy the download link.
   - For example `https://gitlab.com/khulnasoft/web-ide/-/jobs/3615550824/artifacts/raw/tmp/packages/khulnasoft-web-ide-0.0.1-dev-20230118062311.tgz`
   - Make sure the link contains the `/raw/`. Several times I managed to copy the link to the page with the job.
1. Go to `gitlab-org/gitlab` project and type in `yarn add <link to the artifact>`.
1. Follow [these additional steps](./web-ide-releases.md#local-testing) if you are testing KhulnaSoft VSCode Fork changes or changes to the Cloudflare worker implementation.
1. Now you can test your development `khulnasoft-web-ide` build in the KhulnaSoft Rails app.

### VSCode editor

If VSCode is your preferred editor, set the TypeScript version to the one used by the
**workspace** by opening a `.ts` file and running the `TypeScript: Select TypeScript Version...`

For using this project in VSCode or other editors, please see the
[Yarn Editor SDKs](#yarn-editor-sdks).

## Scripts

Here's some scripts which can be run in the project root directory.

| Name                     | Description                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| `yarn run build:ts`      | Builds and checks the typescript files.                            |
| `yarn run clean:ts`      | Cleans up typescript builds.                                       |
| `yarn run start:example` | Starts both the server and watched build of the `example` package. |

## Note about directory meanings

| Directory | Description                                               |
| --------- | --------------------------------------------------------- |
| `lib/`    | This is where we'll put typescript compilations if needed |
| `dist/`   | This is where we'll put actual bundled distributions      |
