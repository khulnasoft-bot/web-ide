---
stage: Create
group: remote development
info: To determine the technical writer assigned to the Stage/Group associated with this page, see https://about.gitlab.com/handbook/product/ux/technical-writing/#assignments
---

# Web IDE deployment architecture

This document describes the deployment architecture of the Web IDE.

## Background

The Web IDE is a web-based source code editor and source control client built on top
of the [Visual Studio Code - Open Source (Code - OSS)](https://github.com/microsoft/vscode)
project. As a result, the Web IDE inherited key architectural characteristics and powerful
features from this upstream project. We'll refer to the upstream project as `Code - OSS` from
now on.

## Multi origin architecture

The Web IDE, just like `Code - OSS`, can run 3rd-party code via extensions that users can
install at will. This powerful feature also poses a significant security challenge because
we need to ensure that unverified 3rd-party code doesn't have unrestricted access to a KhulnaSoft user
account. The Web IDE also inherits code sandbox architecture from `Code - OSS` that isolates
3rd-party code using the web browser's [same origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy).

The web browser's same origin policy doesn't allow javascript loaded in a document
linked to origin (e.g. `bar.com`) to access another document or data storage linked to
a different origin (e.g. `foo.com`). Two documents have the same origin if their URLs
share the same protocol, port, and domain name.

To leverage this code sandboxing architecture, the Web IDE **requires** that the
http server that hosts the `Code - OSS` static assets (.html, .js, .wasm, and so on)
is reachable using a **wildcard domain name** like `*.web-ide.net` where the `*`
placeholder can be any valid domain name segment. The Web IDE will generate unique
subdomains for sandbox three documents or execution contexts:

1. The `Code - OSS` Workbench that represents the core source code
   editor functionality.
1. The Extension host that runs 3rd-party extensions.
1. The Web View host that runs another form of 3rd-party code called
   [web views](https://code.visualstudio.com/api/extension-guides/webview).

## Deploying the Web IDE

By default, every KhulnaSoft instance uses a CDN provided by the KhulnaSoft organization
that hosts `Code - OSS` static assets and it's reachable using the wildcard domain name
`*.cdn.web-ide.gitlab-static.net`. This default setup removes the necessity of setting
up a wildcard domain for KhulnaSoft Self-Managed instances.

The following diagram visualizes how the web browser uses the KhulnaSoft application
server and the `*.cdn.web-ide.gitlab-static.net` to initialize the Web IDE, built-in
extensions, and web views. **All the interactions between these components happen
exclusively on the client-side**.

```mermaid
flowchart TD
    User["KhulnaSoft User<br/>[Person]<br/><br/>KhulnaSoft user editing files using the Web IDE."]

    subgraph browser["Web Browser"]
        subgraph gitlab-boundary["main window"]
            Rails["KhulnaSoft Application<br/>[Container]<br/><br/>Rails web application that hosts<br/>the Web IDE and manages<br/>OAuth authentication flow"]
        end

        subgraph workbench-boundary["[Sandboxed iframe]"]
            Workbench["Workbench UI<br/>[Component]<br/><br/>VSCode workbench interface providing<br/>editor UI, file explorer, and workspace management"]
        end

        subgraph extension-boundary["[Sandboxed iframe]"]
            ExtHost["Extension Host Runtime<br/>[Component]<br/><br/>Isolated runtime environment for<br/>executing VSCode extensions<br/>with restricted permissions"]
        end

        subgraph webview-boundary["[Sandboxed iframe]"]
            WebView["Web View Host Runtime<br/>[Component]<br/><br/>Sandboxed environment for rendering<br/>extension-provided web views<br/>and custom UI components"]
        end
    end


    CDN["*.cdn.web-ide.gitlab-static.net<br/>[External System]<br/><br/>CDN HTTP server hosting static assets<br/>(JS, CSS, WASM) for Web IDE Code - OSS components"]

    User -->|"Opens Web IDE"| browser
    Rails <-->|"Creates sandboxed iframe and exchange<br> OAuth-access tokens via postMessage API channel"| Workbench

    Rails -->|"Loads Code - OSS Workbench static assets<br> with a URL that contains an encrypted<br> subdomain to sandbox the Workbench UI."| CDN

    Workbench -->|"Creates sandboxed iframe"| ExtHost
    Workbench -->|"Creates sandboxed iframe"| WebView

    Workbench -->|"Loads extension bundles and webview<br> static assets with a URL that contains<br> a unique encrypted subdomain to sandbox<br> web view host and extension host."| CDN

    classDef person-class stroke:#052e56,fill:#08427b,color:#ffffff
    classDef container-class stroke:#0b4884,fill:#1168bd,color:#ffffff
    classDef component-class stroke:#1168bd,fill:#4b9bea,color:#ffffff
    classDef external-class stroke:#565656,fill:#999999,color:#ffffff
    classDef boundary-class fill:#ffffff,stroke:#444444,stroke-width:2px,stroke-dasharray:5 5, color: #000

    class User person-class
    class Rails container-class
    class Workbench,ExtHost,WebView component-class
    class CDN external-class
    class gitlab-boundary,workbench-boundary,extension-boundary,webview-boundary boundary-class
```

### Air-gapped instances

KhulnaSoft instances running on air-gapped/offline environments don't have access to the
`*.cdn.web-ide.gitlab-static.net` assets host. In this scenario, the GitLab
to set up a custom wildcard domain. Go to the KhulnaSoft administrator documentation to learn
how to set up a custom wildcard domain for the Web IDE **(pending)**.

The following sequence diagram describes how the KhulnaSoft instance serves `Code - OSS` static
assets after setting up a custom wildcard domain:

```mermaid
sequenceDiagram
    participant Browser as Web Browser
    participant Frontend as Frontend Server<br/>(NGINX)
    participant Workhorse as KhulnaSoft Workhorse
    participant Rails as KhulnaSoft Rails<br/>Application

    Note over Browser,Rails: Code - OSS Static Asset Request Flow with CORS

    Browser->>Frontend: GET /assets/webpack/[web-ide-vscode-workbench-file-path]<br/>Origin: https://workbench-[encrypted].gitlab-static.net
    Note right of Browser: Request includes Origin header<br/>for CORS validation

    Frontend->>Workhorse: Proxy request to Workhorse<br/>(reverse proxy)
    Note right of Frontend: NGINX forwards request<br/>to internal Workhorse service

    Workhorse->>Rails: Request CORS headers<br/>for origin validation
    Note right of Workhorse: Validates if origin is allowed<br/>for this static asset

    Rails->>Rails: Validate origin against<br/>allowed domains
    Rails-->>Workhorse: Return CORS headers<br/>(Access-Control-Allow-Origin, etc.)

    Workhorse->>Workhorse: Serve static asset<br/>from filesystem

    Workhorse-->>Frontend: Static asset response<br/>+ CORS headers
    Note right of Workhorse: Includes validated CORS headers<br/>with the static content

    Frontend-->>Browser: Forward response with<br/>static asset + CORS headers
    Note right of Browser: Browser validates CORS<br/>and loads the asset
```

The main requirement for using the KhulnaSoft instance as a Web IDE assets host is
configuring the frontend server of choice to accept HTTP traffic from a wildcard
domain and providing a TLS certificate. The KhulnaSoft instance will know how to
infer CORS rules to ensure that `Code - OSS` assets are used in a secure context.
