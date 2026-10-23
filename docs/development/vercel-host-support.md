---
stage: AI Clients
group: unassigned
info: To determine the technical writer assigned to the Stage/Group associated with this page, see https://about.gitlab.com/handbook/product/ux/technical-writing/#assignments
---

# Vercel host support: analysis and refactoring plan

Status: proposal

This document analyses what it would take to deploy the Web IDE assets and the
example embedder application on [Vercel](https://vercel.com) instead of
Cloudflare R2 + Workers, and proposes a phased refactoring plan.

The goal is **host portability**, not replacing the existing Cloudflare
deployment. Cloudflare remains the production asset host for GitLab.

## 1. Goal and non-goals

### Goals

- Deploy the existing build output (`packages/example/dist`) to Vercel as a
  static deployment.
- Keep the multi-origin sandbox model (embedder, workbench, extension host) when
  a wildcard domain is available.
- Provide a usable single-origin fallback for preview deployments and for
  domains without wildcard support.
- Keep the Cloudflare deployment working unchanged.

### Non-goals

- Reimplementing the Cloudflare Worker (R2, ETag/If-Match, health checks, custom 404) on Vercel.
- Changing the `@gitlab/web-ide` package consumed by the GitLab Rails
  application.
- Migrating production traffic away from `*.cdn.web-ide.gitlab-static.net`.

## 2. Current deployment model

### 2.1 Components and origins

| Component              | Code                                  | Current host                                                 |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------ |
| Embedder (example app) | `packages/example`                    | GitLab Pages (`gitlab-org.gitlab.io/gitlab-web-ide`)         |
| Workbench assets       | `packages/web-ide/dist/public`        | GitLab Pages (relative) or `*.cdn.web-ide.gitlab-static.net` |
| Extension host         | `packages/web-ide/dist/public/vscode` | `*.cdn.web-ide.gitlab-static.net` (`{{uuid}}` subdomain)     |
| Asset server           | `packages/cloudflare`                 | Cloudflare Worker backed by R2                               |

The example embeds the workbench in an iframe and passes it the
`workbenchBaseUrl`, `embedderOriginUrl`, and `extensionsHostBaseUrl`:

- `packages/example/src/components/WebIde.vue:177` – config wiring.
- `packages/web-ide/src/index.ts:87` – workbench URL is
  `${workbenchBaseUrl}/assets/workbench.html`.
- `packages/vscode-bootstrap/src/main.ts:59` – AMD loader is loaded from
  `${workbenchBaseUrl}/vscode/out/vs/loader.js`.
- `packages/vscode-bootstrap/src/start.ts:136` – extension/webview host uses
  `extensionsHostBaseUrl`, which the VS Code runtime expands from the
  `{{uuid}}` template.

### 2.2 Origin selection is build time

`packages/example/src/config.ts:8` reads `VITE_*` variables through
`readFromViteEnv`. The variables are baked in by Vite at build time. The active
profile is selected with `VITE_HOST_PROTOCOL` (`https` by default), which
appends `_HTTPS` or `_HTTP` to each key:

```dotenv
VITE_WORKBENCH_BASE_URL_HTTPS="https://workbench.127.0.0.1.nip.io:8000/web-ide/public"
VITE_EXTENSIONS_HOST_BASE_URL_HTTPS="https://{{uuid}}.127.0.0.1.nip.io:8000/web-ide/public/vscode"
```

See `config/.env`, plus the build scripts in `package.json:47-55`.

### 2.3 The Cloudflare asset host contract

`packages/cloudflare/src/main.ts` provides behaviour that a static host does not
have:

- strips the first host label (`main.ts:93`), so `abc.cdn.example.com/foo.js`
  is read from R2 key `foo.js`;
- applies `PATH_PREFIX`, `INDEX_FILE`, and `NOTFOUND_FILE` (`main.ts:116`);
- echoes an allowlisted `Origin` in `Access-Control-Allow-Origin`
  (`generateAccessControlAllowOriginPolicy.ts:7`);
- sets `Cross-Origin-Resource-Policy: cross-origin` (`main.ts:280`);
- handles `Range`, `ETag`, `If-Match`/`If-None-Match`, caching, and a
  health-check path (`main.ts:143-286`).

Only the CORS and CORP headers are strictly required for the Web IDE. The rest
are storage/HTTP correctness features that Vercel's static CDN already provides
or does not need.

### 2.4 Build output

`make packages/example` produces:

```text
packages/example/dist/
├── index.html
├── oauth_callback.html
├── assets/                  # Vite hashed assets
├── fonts/
└── web-ide/public/          # Workbench + built-in extensions
    ├── main.js
    ├── assets/workbench.html
    └── vscode/
```

Current size: ~182 MB, ~1,100 files, largest file ~40 MB.

## 3. Vercel constraints and gaps

### 3.1 Wildcard origins

The multi-origin sandbox requires `https://{{uuid}}.<domain>` to resolve to the
asset host. On Vercel that means:

1. Add a **wildcard custom domain** (`*.example.com`) to the project, in
   addition to the embedder domain.
2. Delegate `_acme-challenge` to Vercel (or use Vercel nameservers) so Vercel can
   issue the wildcard certificate.
3. The wildcard certificate covers exactly one label, which is sufficient for
   `{{uuid}}.example.com` and `workbench.example.com`.

This is **not possible with `*.vercel.app`**. Deployment URLs are generated and
cannot be used as arbitrary sandbox subdomains. A custom domain is therefore a
hard requirement for full multi-origin mode. Wildcard domains and external DNS
delegation are available on paid Vercel plans; confirm the plan during the
spike.

### 3.2 Static routing removes the need for host-based rewrites

On Cloudflare, the hostname is stripped and mapped to a flat R2 namespace. On
Vercel, every alias of a deployment serves the same file tree, including
`/web-ide/public/...`. Therefore:

- `https://workbench.example.com/web-ide/public/assets/workbench.html` works
  without a rewrite rule.
- `https://{{uuid}}.example.com/web-ide/public/vscode/...` works without a
  rewrite rule.

No Edge Function or middleware is required for the basic topology. This is the
main simplification compared with the Cloudflare Worker.

### 3.3 Headers

Vercel cannot dynamically echo `Origin` from static configuration. Replace the
Cloudflare allowlist with static headers:

```text
Access-Control-Allow-Origin: *
Cross-Origin-Resource-Policy: cross-origin
```

This is acceptable because the hosted content is public, immutable, and
unauthenticated. Authorization is carried by the Web IDE's own API requests,
not by asset cookies. If credentialed asset requests are ever required, an Edge
Function would be needed to echo `Origin`, but that would also put static assets
through a function (undesirable).

`OPTIONS` preflight is not expected: the Web IDE loads scripts, styles, fonts,
and WASM with simple `GET` requests. Add an explicit fallback only if a browser
test shows a preflight.

### 3.4 Caching and atomic releases

`/web-ide/public/...` is **not content-hashed** today. Cloudflare sets
`max-age=31536000, public` for production, which is safe only because the R2
path includes the release version (for example
`gitlab-web-ide-vscode-workbench-<version>`). The Vercel build output uses the
unversioned `/web-ide/public` path.

If Vercel serves unversioned paths with a long TTL, a browser or CDN can mix
files from two releases. Options:

- **Recommended:** include a release segment in the path, for example
  `/web-ide/<git-sha>/public`, and cache it immutably.
- Or use a short TTL (`max-age=60`/`max-age=3600`) while the path is
  unversioned.

Vite's own `/assets/*` files are hashed and can be cached immutably.

### 3.5 Health checks, 404s, and method handling

The Cloudflare Worker provides `/-/ping` and a configurable 404 document. On
Vercel:

- Health checks can be served with a rewrite to a static `ping.txt`, or replaced
  by Vercel's own monitoring. They are not used by the Web IDE itself.
- Vercel serves `404.html` from the output root automatically, if present.
- The static CDN supports `GET`/`HEAD` and HTTP range requests (needed for large
  WASM files). Other methods are not part of the asset contract.

### 3.6 Build and deployment limits

| Limit                   | Value                                | Impact                                                                 |
| ----------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| Build time              | 45 min per deployment                | The build downloads and unpacks the VS Code tarball; measure in spike. |
| Source upload (CLI)     | 100 MB Hobby / 1 GB Pro              | Prebuilt `dist` is ~182 MB, so use Pro + `--archive` if deploying CLI. |
| Source file count (CLI) | 15,000 files                         | `dist` has ~1,100 files, so this is fine.                              |
| Output files            | No hard cap (build-time constrained) | Fine.                                                                  |
| Framework detection     | Must be disabled                     | The repository is not a Next.js project.                               |

The repository itself is small; a git-connected build only uploads the source,
then downloads the VS Code tarball during the build. This is the preferred
model. `--prebuilt` is a fallback for CI and requires Pro storage limits.

### 3.7 Preview deployments and deployment protection

- Preview URLs (`<project>-<hash>.vercel.app`) cannot provide wildcard
  subdomains. Use the single-origin fallback for previews.
- Vercel Deployment Protection (SSO/password) intercepts subdomain asset
  requests and can break iframes and cross-origin loads. Production aliases must
  be unprotected. If protected previews are required, use a protection bypass
  token or single-origin mode.
- Each preview is immutable, which makes caching simpler than on production.

### 3.8 GitLab CORS is an external prerequisite

The workbench probes the GitLab GraphQL endpoint at
`packages/vscode-bootstrap/src/main.ts:92`. The browser origin performing that
request is the workbench origin (`workbench.<domain>`), not the embedder. The
GitLab instance must allow that origin (and the extension host origin if it
calls the API).

For `gitlab.com`, an arbitrary Vercel domain is unlikely to be allowlisted. A
Vercel deployment is therefore most useful against a GDK/self-managed instance
whose CORS configuration includes the Vercel origins, or after GitLab allows the
domain. This must be validated early, because a CORS failure prevents the IDE
from starting even when the assets are served correctly.

## 4. Deployment topologies

### A. Full multi-origin (required for the real sandbox model)

```text
https://web-ide.example.com                       -> embedder + /assets + /web-ide/public
https://workbench.example.com/web-ide/public      -> workbench origin
https://<uuid>.example.com/web-ide/public/vscode  -> extension host origin
```

- Add `example.com`, `workbench.example.com` implicitly via `*.example.com`, and
  `*.example.com` to the same Vercel project.
- `VITE_WORKBENCH_BASE_URL=https://workbench.example.com/web-ide/public`
- `VITE_EXTENSIONS_HOST_BASE_URL=https://{{uuid}}.example.com/web-ide/public/vscode`
- `VITE_CROSS_ORIGIN_EXTENSION_HOST=true`

### B. Single-origin fallback (previews, no wildcard domain)

```text
https://web-ide.example.com -> embedder
https://web-ide.example.com/web-ide/public -> workbench
https://web-ide.example.com/web-ide/public/vscode -> extension host
```

- `VITE_WORKBENCH_BASE_URL=web-ide/public` (relative; resolves against the
  embedder URL)
- `VITE_EXTENSIONS_HOST_BASE_URL=web-ide/public/vscode`
- `VITE_CROSS_ORIGIN_EXTENSION_HOST=false`

This works on any `*.vercel.app` URL, at the cost of weaker extension isolation.
It is the correct default for preview deployments.

## 5. Proposed refactoring plan

### Phase 1 – Add a host profile for the embedder

1. Make `crossOriginExtensionHost` configuration-driven. It is currently
   hardcoded to `true` in `packages/example/src/components/WebIde.vue:180`.
   Add `getCrossOriginExtensionHost()` to `packages/example/src/config.ts`
   (defaulting to `true` to preserve current behaviour) and read
   `VITE_CROSS_ORIGIN_EXTENSION_HOST`.
2. Add a `build:example:vercel` script that sets `VITE_HOST_PROTOCOL=vercel`
   and validates the profile.
3. Add a `.env.vercel`-style template or document the exact environment
   variables in the Vercel dashboard. Because the custom domain is not known at
   commit time, the wildcard domain must be supplied as a build environment
   variable (recommended: `VITE_VERCEL_WILDCARD_DOMAIN`).
4. Add a build helper, for example `scripts/vercel/build.sh`, that:
   - derives the embedder URL from `VERCEL_PROJECT_PRODUCTION_URL` when
     available;
   - sets the multi-origin values when a wildcard domain is configured;
   - falls back to single-origin values otherwise;
   - runs the existing `make packages/example` build.
5. Add a startup validation in the example app: if
   `crossOriginExtensionHost` is true and the extensions host does not use a
   distinct origin (or the `{{uuid}}` template), log a clear configuration
   error instead of failing later inside VS Code.

### Phase 2 – Add Vercel project configuration

Add a root `vercel.json` (do not replace Cloudflare configuration):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": null,
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "bash ./scripts/vercel/build.sh",
  "outputDirectory": "packages/example/dist",
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,HEAD,OPTIONS" },
        { "key": "Cross-Origin-Resource-Policy", "value": "cross-origin" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/web-ide/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=60, must-revalidate" }]
    }
  ]
}
```

Notes:

- `framework: null` prevents Vercel from trying to infer a framework.
- Keep the unversioned `web-ide` TTL short until Phase 4 adds a version segment.
- `Access-Control-Allow-Origin: *` is safe for public assets and avoids the
  dynamic-origin limitation. If a stricter policy is required, an Edge Function
  must replace it.
- Do not add global `X-Frame-Options`/`frame-ancestors` restrictions; the
  embedder and workbench are intentionally framed.

Add `.vercel` to `.gitignore` unless the team deliberately wants to commit the
project link. The repository currently contains `.vercel/project.json`.

### Phase 3 – Deployment pipeline

1. Add `deploy:vercel` to `package.json` and a `make deploy-vercel` target.
2. Add a CI job (GitHub Actions and/or GitLab CI) that runs:
   - `vercel pull --yes --environment=production`
   - `vercel build --prod`
   - `vercel deploy --prebuilt --prod`
     with `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` from secrets.
3. Keep the Git-connected build as the default for pull requests/previews. Use
   `vercel.json` to select single-origin mode when no wildcard domain is set.
4. Add build caching for `.pnpm-store` and `packages/vscode-build/dist` if the
   build approaches the 45-minute limit.
5. Ensure the build has network access to the VS Code tarball URL in
   `packages/vscode-build/vscode_version.json`. If the tarball is not publicly
   reachable from Vercel, mirror it or build in CI and deploy `--prebuilt`.

### Phase 4 – Versioned asset paths and cache correctness

1. Introduce `WEB_IDE_ASSET_VERSION` (default: `VERCEL_GIT_COMMIT_SHA` or
   `package.json` version).
2. Change the Makefile copy target (`Makefile:182`) to copy to
   `dist/web-ide/${WEB_IDE_ASSET_VERSION}/public`.
3. Set `VITE_WORKBENCH_BASE_URL` and `VITE_EXTENSIONS_HOST_BASE_URL` to include
   the same version segment.
4. Cache `/web-ide/*` immutably.
5. Keep old release paths available for the duration of the longest cached
   session, or accept that deploys are atomic at the deployment URL level.

### Phase 5 – Tests, observability, and documentation

1. Add a Playwright project that targets the Vercel preview/production URL and
   verifies:
   - the embedder loads;
   - the workbench iframe boots;
   - built-in extensions `package.json` files load;
   - WASM files load with the correct MIME type;
   - CORS succeeds from the workbench and extension host origins;
   - OAuth callback URL uses the current host.
2. Add a smoke test for range requests on a large WASM file
   (`Range: bytes=0-1023`).
3. Add a `/-/ping` check only if a monitoring integration needs it.
4. Extend `docs/development/deployment.md` with a Vercel section and link this
   document.
5. Document the environment matrix and the wildcard-domain/DNS steps.

## 6. Concrete file impact

| File / area                                      | Change                                                            |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| `packages/example/src/config.ts`                 | Add `getCrossOriginExtensionHost()`, optional validation helpers. |
| `packages/example/src/components/WebIde.vue:180` | Use the new config getter instead of hardcoded `true`.            |
| `packages/example/src/config.test.ts`            | Cover the new getter and profile selection.                       |
| `package.json`                                   | Add `build:example:vercel` and `deploy:vercel` scripts.           |
| `Makefile`                                       | Add deploy target; optionally parameterize the asset output path. |
| `vercel.json`                                    | New file: build/output/headers configuration.                     |
| `scripts/vercel/build.sh`                        | New file: profile selection and environment validation.           |
| `.gitignore`                                     | Add `.vercel` (decision required).                                |
| `.github/workflows/ci.yml` / `.gitlab-ci.yml`    | Add a Vercel deployment job.                                      |
| `docs/development/deployment.md`                 | Link the Vercel topology and prerequisites.                       |
| `packages/cloudflare/**`                         | No change. Vercel is an additional host adapter.                  |

## 7. Environment matrix

### Multi-origin (production, wildcard domain)

```dotenv
VITE_HOST_PROTOCOL=vercel

# Optional: used by scripts/vercel/build.sh
VITE_VERCEL_WILDCARD_DOMAIN=example.com

VITE_EMBEDDER_ORIGIN_URL=https://web-ide.example.com
VITE_WORKBENCH_BASE_URL=https://workbench.example.com/web-ide/public
VITE_EXTENSIONS_HOST_BASE_URL=https://{{uuid}}.example.com/web-ide/public/vscode
VITE_CROSS_ORIGIN_EXTENSION_HOST=true
```

### Single-origin (previews, no wildcard)

```dotenv
VITE_HOST_PROTOCOL=vercel
VITE_WORKBENCH_BASE_URL=web-ide/public
VITE_EXTENSIONS_HOST_BASE_URL=web-ide/public/vscode
VITE_CROSS_ORIGIN_EXTENSION_HOST=false
```

`VITE_EMBEDDER_ORIGIN_URL` may be omitted; a relative value resolves against the
current document URL.

## 8. Risks and open questions

| Risk / question                                      | Mitigation / next step                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| Wildcard domain not available on the Vercel plan     | Use single-origin fallback; document reduced isolation.                        |
| GitLab CORS rejects the Vercel workbench origin      | Spike with a GDK instance; add the origins to the instance's CORS config.      |
| VS Code build exceeds 45 minutes                     | Measure; cache `.pnpm-store` and `packages/vscode-build/dist`; prebuild in CI. |
| Tarball not reachable from Vercel build network      | Mirror the tarball or deploy a CI-built artifact with `--prebuilt`.            |
| Unversioned asset paths cause mixed releases         | Implement Phase 4 before enabling long-lived caching.                          |
| Vercel Deployment Protection blocks subdomain assets | Disable protection on production alias; use bypass token for protected tests.  |
| `Access-Control-Allow-Origin: *` is too permissive   | Content is public; if not acceptable, use an Edge Function to echo `Origin`.   |
| Static `OPTIONS` behaviour                           | Verify in browser; add a function only if preflight is observed.               |
| Preview URLs cannot use `{{uuid}}`                   | Force single-origin profile on preview builds.                                 |

## 9. Acceptance criteria

- A Vercel deployment of `main` serves the example app at the production alias.
- With a wildcard domain, the workbench and extension host load from distinct
  origins and the IDE reaches the ready state.
- Without a wildcard domain, the single-origin profile loads and boots.
- `Access-Control-Allow-Origin` and `Cross-Origin-Resource-Policy` are present
  on `/web-ide/**`.
- Built-in extension manifests load; WASM compiles; large assets support range
  requests.
- Existing Cloudflare deployment and GitLab Pages jobs are unaffected.
- The Vercel configuration and environment matrix are documented.

## 10. Rollout and rollback

1. Land Phases 1–3 behind a new npm script and a Vercel project; keep Cloudflare
   production untouched.
2. Deploy only previews for a week and run the Playwright smoke suite.
3. Promote a production alias only after the GitLab CORS prerequisite is
   confirmed for the target instance.
4. Roll back by removing the Vercel alias; Cloudflare and GitLab Pages remain
   the source of truth.
