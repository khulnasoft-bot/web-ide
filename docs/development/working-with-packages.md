---
stage: Create
group: remote development
info: To determine the technical writer assigned to the Stage/Group associated with this page, see https://about.gitlab.com/handbook/product/ux/technical-writing/#assignments
---

# Working with packages

This project uses [yarn 2+ workspaces](https://yarnpkg.com/features/workspaces) to
split up the code and responsibilities into cohesive packages.

The `web-ide` package is the main package which will be consumed by the GitLab project. In this
project, it is also consumed by the `example` package.

Currently the `web-ide` package is the only package that is published.

## How to add a new workspace package?

1. Create a new folder under the `/packages` folder. Example:

   ```shell
   mkdir /packages/new-package
   ```

2. Under the new package folder, add a `package.json`. Example:

   ```json
   {
     "name": "@gitlab/new-package",
     "version": "0.0.1",
     "main": "./src/index.ts",
     "packageManager": "yarn@3.2.0",
     "publishConfig": {
       "main": "./lib/index.js"
     }
   }
   ```

3. Under the new package folder, add a `tsconfig.json`. Example:

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

4. Create a `src/` directory under your new package to hold the source files. Add an `index.ts` to `src/` which will be the main entrypoint to the package. Example:

   ```shell
   mkdir packages/new-package/src
   touch packages/new-package/src/index.ts
   ```

5. Add a reference to the package under the root `tsconfig.json`. Example:

   ```json
   {
     // ...
     "references": [
       // ... existing packages...
       { "path": "./packages/new-package" } // <<<< new package!
       // ... existing packages...
     ]
     // ...
   }
   ```

## How to add a package dependency to a workspace package?

Update the `dependenies` (or `devDependencies`) field in the requiring package's `package.json` with a reference to the name of the workspace package. Example:

```json
{
  "name": "@khulnasoft/web-ide",
  // ...
  "devDendencies": {
    // ...
    "@khulnasoft/web-ide-types": "workspace:*"
    // ...
  }
  // ...
}
```

**Heads up!** If you add a `dependency` on a workspace package to a package that will be deployed, that workspace package will also need to be deployed. If the package is only meant to provide a compilation of itself, consider adding workspace package dependencies as `devDependency`.
