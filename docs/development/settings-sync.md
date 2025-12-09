# Settings Sync

VSCode supports an out-of-the-box solution to synchronize VSCode configurations across machines. This feature is called [Settings Sync](https://code.visualstudio.com/docs/editor/settings-sync).

Currently, Settings Sync is only available within the Web IDE and is always enabled upon initialization. The following workbench configurations are required to enable Settings Sync in the Web IDE:

- [`configurationSync.store`](https://github.com/microsoft/vscode/blob/main/src/vs/base/common/product.ts) field in `productConfiguration`.
- [`settingsSyncOptions`](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/browser/web.api.ts)

This document provides a technical overview of VSCode's Settings Sync feature. Note that GitLab's implementation of the Settings Sync API only allows one snapshot per resource per user, instead of VSCode's expected per resource per machine per user. This is due to the DB cost of storing per-machine (ephemeral) data.

## Settings Sync API

### Terminology

- **Resource**: a VSCode configuration, which can be any of the following:
  - Settings
  - Keyboard shortcuts/keybindings
  - Code snippets
  - Tasks
  - Extensions: extensions are synced along with their global enablement state.
  - UI state, also known as the Global State
  - User Profiles
- **Machine**: the platform running VSCode, this includes the environment (web vs. workspace) and the browser.
- **Snapshot**: the value of a resource at a specific moment.
- **Global State**: the global UI state. Some examples include: display language, activity bar and panel entries, and recently used commands.

### Resource types

- `settings`
- `globalState`
- `keybindings`
- `snippets`
- `extensions`

## Settings Context Hash

The settings context hash is a KhulnaSoft feature that allows scoping extensions settings based on the Web IDE's Extensions Marketplace settings. This is represented by the `settingsContextHash` field in the Web IDE configuration and is passed to the Settings Sync API as part of the the path parameter.

### `GET` `(/:settings_context_hash)/v1/manifest`

Returns an object containing the latest snapshot saved by a machine per user for all resource types, which is identified by a UUID. Also returns the session UUID.

Example response:

```json
{
  "latest": {
    "settings": "86f392c1-bfcd-4614-a829-e88fce8fb184",
    "globalState": "77e8bd67-2280-4be0-9652-0e148103c784",
    "extensions": "e1189503-3d6f-4205-9e48-d33e4e45f3d9",
    "machines": "374e4469-88bb-4718-be88-fe5e281e42dc"
  },
  "session": "ed4d3c05-97bb-4151-a8b3-09a16db1f3b6"
}
```

### `GET` `(/:settings_context_hash)/v1/resource/:resource_type`

Returns a list of references to the latest snapshots from most recent to oldest. This is used to display a history of sync activity based on resource type in the `Show Sync Data` view.

Example response:

```json
[
  {
    "url": "/v1/resource/settings/d8217aef-7eec-4f89-9689-aa647525c57d",
    "created": 1726152506
  },
  {
    "url": "/v1/resource/settings/d4934dd2-cedb-430e-af11-63d0365b0e7f",
    "created": 1726064606
  }
]
```

### `GET` `(/:settings_context_hash)/v1/resource/:resource_type/latest`

Returns the latest snapshot for the specified resource type.

Example response:

```json
{
    {
        "version": 5,
        "machineId": "4b959cb8-acfc-4086-95aa-220e9ebd49ac",
        "content": "[{\"identifier\":{\"id\":\"vscode.bat\"},\"version\":\"1.0.0\",\"preRelease\":false,\"pinned\":false}]"
    }
}
```

### `GET` `(/:settings_context_hash)/v1/resource/:resource_type/:uuid`

Returns a snapshot for the given specified resource type and snapshot UUID. If no snapshots exist for the resource (for example: if the user has not defined the resource), `0` will be passed instead of the UUID. The same response is returned as the `GET` `/v1/resource/:resource_type/latest` endpoint.

Note that the response is slighly different for the `machines` resource type:

```json
{
  "version": 1,
  "machines": [
    {
      "id": "5b842d9f-1629-462b-bf74-9dc7abf156fd",
      "name": "Web - Chrome (Code) #1",
      "platform": "Chrome"
    },
    {
      "id": "7261007a-1872-4a93-a8c9-db01c61d5e13",
      "name": "Workspaces - Firefox (Code) #1",
      "platform": "Firefox",
      "disabled": true
    }
  ]
}
```

### `POST` `(/:settings_context_hash)/v1/resource/:resource_type`

Creates a snapshot of the specified resource type.

Example payload:

```json
{
  "version": 2,
  "machineId": "5c3cff03-c66d-498d-8226-5dd8489dc2a1",
  "content": "{\"settings\":\"{\\n    \\\"workbench.colorTheme\\\": \\\"Bearded Theme Milkshake Blueberry\\\"\\n}\"}"
}
```

### `POST` `(/:settings_context_hash)/v1/resource/machines`

Creates a machine or updates existing machines.

Example payload:

```json
{
  "machines": [
    {
      "id": "5b842d9f-1629-462b-bf74-9dc7abf156fd",
      "name": "Web - Chrome (Code) #1",
      "platform": "Chrome"
    },
    {
      "id": "7261007a-1872-4a93-a8c9-db01c61d5e13",
      "name": "Workspaces - Firefox (Code) #1",
      "platform": "Firefox",
      "disabled": true
    }
  ],
  "version": 1
}
```

Disabling settings sync for a machine in the `Show Sync Data` view results in the addition of the `disabled` field to the machine object.

## Sync process

There are 3 components to the sync process:

- **Local changes**: when running VSCode on the web, a machine UUID is created based on the platform (including IDE environment and browser). This is stored in IndexedDB stores along with the local settings. This means that local changes are persisted across browser sessions (windows and tabs).
- **Remote changes**: refers to the latest synced snapshot for each resource across different machines. The `/v1/manifest` endpoint is polled to retrieve this information.
- **Last synced changes**: during the sync process, the last synced snapshot UUID is stored by the machine for each resource type. This can be found in the `vscode-web-state-db-global` IndexedDB store with `<resource_type>.lastSyncUserData` as its key.

Each VSCode instance compares the last synced, remote, and local changes to determine which changes to adopt. If the last synced and remote changes are different, VSCode will overwrite the local changes with the remote changes. If they are the same, the current local changes will be synced to the server.
