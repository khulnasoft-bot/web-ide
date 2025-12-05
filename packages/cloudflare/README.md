# Assets hosting via cdn.web-ide.gitlab-static.net

This directory contains the Cloudflare worker code to handle requests to:

- `*.cdn.web-ide.gitlab-static.net`
- `*.staging.cdn.web-ide.gitlab-static.net`

Deployment is done using [Wrangler](https://developers.cloudflare.com/workers/wrangler/), which is a CLI for building with
Cloudflare developer products. You can use it to manage Workers KV, R2 buckets & objects, secrets and for deploying workers,
which is what we mainly use it for.

## Setup

1. Run `yarn install` (from the repo root) locally to install the necessary packages to run wrangler.
1. Export `CLOUDFLARE_API_TOKEN` with a token that has access to workers, R2, etc in the zone you're targeting:

   ```sh
   export CLOUDFLARE_API_TOKEN=xxx
   ```

1. Trigger the desired `yarn` commands below.

## Running in development mode

You can run in development mode with local resources (ie. temporary KV local store using SQLite):

```sh
yarn cloudflare:start -e staging --host abc123.staging.cdn.web-ide.gitlab-static.net
```

... but it's more useful to run in development mode with `--remote`, which uses remote resources (e.g., R2) and data stored on Cloudflare's network.

```sh
yarn cloudflare:start -e staging --host abc123.staging.cdn.web-ide.gitlab-static.net --remote
```

The `--host` argument is required to override the default host of the site name (`gitlab-static.net`).

Any request you make to `http://127.0.0.1:8787` will be as if you were making the request to `https://abc123.staging.cdn.web-ide.gitlab-static.net`.

## Deployment

To deploy, you need to run a command like the following:

```sh
yarn cloudflare:deploy -e staging
```
