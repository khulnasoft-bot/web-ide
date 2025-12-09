---
stage: Create
group: remote development
info: To determine the technical writer assigned to the Stage/Group associated with this page, see https://about.gitlab.com/handbook/product/ux/technical-writing/#assignments
---

# Developer FAQ

## Why not use Yarn Plug n' Play?

We started this project using Plug n' Play but we kept running into environment specific
issues ([see example](https://gitlab.com/khulnasoft/web-ide/-/merge_requests/124)).
The extra complexity of using `.zip` files for third party modules was not worth any space
optimization benefit.

It looks like workspaces work just fine with `nodeLinker: 'node-modules'`, so
here we are.

## How do I run the example with HTTPS?

1. Make sure you have valid certificate files named `cert.pem` and `key.pem` in the project's root directory.
   You may want to create these outside the directory using something like `mkcert`. Then you can simply create
   symlinks in the project directory, with `ln -s <PATH_TO_CERT> ./cert.pem`.
2. Run `yarn start:example:ssl`.

# Developer Troubleshooting

## I'm adding a package and it doesn't work.

When adding (or removing) a new package, you will need to run `yarn install` for yarn to recognize the
workspace.

## Typescript isn't finding native JavaScript things.

Make sure that the package's `tsconfig.json` is extending the base config:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./lib",
    "rootDir": "./src"
  }
}
```
