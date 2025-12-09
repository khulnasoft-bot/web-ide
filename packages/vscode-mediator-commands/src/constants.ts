export const PREFIX = 'khulnasoft-web-ide.mediator' as const;

// region: message names -----------------------------------------------
export const MESSAGE_READY = `${PREFIX}.ready` as const;
export const MESSAGE_OPEN_URI = `${PREFIX}.open-uri` as const;
export const MESSAGE_PREVENT_UNLOAD = `${PREFIX}.prevent-unload` as const;
export const MESSAGE_SET_HREF = `${PREFIX}.set-href` as const;
export const MESSAGE_TRACK_EVENT = `${PREFIX}.track-event` as const;
export const MESSAGE_UPDATE_WEB_IDE_CONTEXT = `${PREFIX}.update-web-ide-context` as const;

// region: DEPRECATED command names ------------------------------------
export const COMMAND_START = `${PREFIX}.start` as const;
export const COMMAND_FETCH_FILE_RAW = `${PREFIX}.fetch-file-raw` as const;
export const COMMAND_FETCH_MERGE_REQUEST_DIFF_STATS =
  `${PREFIX}.fetch-merge-request-diff-stats` as const;
export const COMMAND_FETCH_PROJECT_BRANCHES = `${PREFIX}.fetch-project-branches` as const;
export const COMMAND_CREATE_PROJECT_BRANCH = `${PREFIX}.create-project-branch` as const;
export const COMMAND_COMMIT = `${PREFIX}.commit` as const;
