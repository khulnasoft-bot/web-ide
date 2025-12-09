---
stage: Create
group: remote development
info: To determine the technical writer assigned to the Stage/Group associated with this page, see https://about.gitlab.com/handbook/product/ux/technical-writing/#assignments
---

# GitLab VSCode theme extension

The GitLab VSCode theme extension contains three
[color theme](https://code.visualstudio.com/api/references/theme-color) implementations
used by the Web IDE:

- GitLab Dark Midnight.
- GitLab Dark.
- GitLab Light.

It also contains an icons font with icons used by the Web IDE. GitLab also releases this
extension as a standalone package to style other VSCode projects like Workspaces.

## Icons font

We need to pack icon illustrations in a web font file to use them
in different parts of the Web IDE UI. See [`contribute.icons`](https://code.visualstudio.com/api/references/contribution-points#contributes.icons)
for more information. The `packages/vscode-extension-web-ide/assets/fonts`
directory contains the Web IDE icons font. This document describes how to use and
the icons font and how to add new icons.

### Illustrations best practices

The illustration should be in svg format.

Prefer simple `path` over `clipPath`.

```svg
<g clip-path="url(#shape)" clip-path="M15.6845 6.43731L15.663 6.38131L13..." fill="white"/>
</g>
<defs>
<clipPath id="shape">
<rect width="16" height="16" fill="white"/>
</clipPath>
```

A simple path will lead to consistent results when generating the font:

```svg
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15.6845 6.43731L15.663 6.38131L13..." fill=""/>
</svg>
```

### Illustration file name

The illustration file’s name should be prefixed with the unicode character that corresponds
to the icon, for example: `uEA01-gitlab-tanuki.svg`, `uEA02-gitlab-merge-request.svg`, etc.
The icon unicode character is referenced in the `icons` contribution section of
`vscode.package.json`.

```json
"icons": {
  "gitlab-tanuki": {
    "description": "GitLab Tanuki",
    "default": {
      "fontPath": "assets/fonts/gitlab_webide.woff",
      "fontCharacter": "\\eA01"
    }
  }
}
```

### Updating the icons font

Follow these steps to add or remove icons from the icons font:

1. Add or remove an svg icon illustration from `packages/vscode-extension-khulnasoft-vscode-theme/assets/fonts/icons`.
2. Run `yarn build:font` to update the web font file.
3. Commit and push the changes.
