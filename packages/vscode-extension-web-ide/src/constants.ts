import { WEB_IDE_EXTENSION_ID as FULL_EXTENSION_ID } from '@khulnasoft/web-ide-interop';

export const EXTENSION_ID = 'khulnasoft-web-ide';

export const OUTPUT_CHANNEL_NAME = 'GitLab Web IDE';

export const AUTHENTICATION_PROVIDER_ID = 'khulnasoft-web-ide';

export const FS_SCHEME = 'khulnasoft-web-ide';
export const SCM_SCHEME = 'khulnasoft-web-ide-scm';
export const MR_SCHEME = 'khulnasoft-web-ide-mr';

export const GET_STARTED_WALKTHROUGH_ID = `${FULL_EXTENSION_ID}#getStartedWebIde`;

// region: commands ----------------------------------------------------

export const COMMIT_COMMAND_ID = `${EXTENSION_ID}.commit`;
export const COMMIT_COMMAND_TEXT = 'Commit and push';

export const COMMIT_AND_FORCE_PUSH_COMMAND_ID = `${EXTENSION_ID}.commit-and-force-push`;
export const COMMIT_AND_FORCE_PUSH_COMMAND_TEXT = 'Commit and force push';

export const COMMIT_AMEND_AND_FORCE_PUSH_COMMAND_ID = `${EXTENSION_ID}.commit-amend-and-force-push`;
export const COMMIT_AMEND_AND_FORCE_PUSH_COMMAND_TEXT = 'Amend commit and force push';

export const SECONDARY_COMMIT_COMMAND_TEXT = 'Create new branch and commit';

export const CHECKOUT_BRANCH_COMMAND_ID = `${EXTENSION_ID}.checkout-branch`;

export const CREATE_BRANCH_COMMAND_ID = `${EXTENSION_ID}.create-branch`;

export const CREATE_BRANCH_FROM_BASE_COMMAND_ID = `${EXTENSION_ID}.create-branch-from-base`;

export const DELETE_BRANCH_COMMAND_ID = `${EXTENSION_ID}.delete-branch`;

export const COMPARE_WITH_MR_BASE_COMMAND_ID = `${EXTENSION_ID}.compare-with-mr-base`;

export const GO_TO_GITLAB_COMMAND_ID = `${EXTENSION_ID}.go-to-gitlab`;

export const GO_TO_PROJECT_COMMAND_ID = `${EXTENSION_ID}.go-to-project`;

export const GO_TO_USER_PREFERENCES_COMMAND_ID = `${EXTENSION_ID}.go-to-user-preferences`;

export const GO_TO_EXTENSION_MARKETPLACE_HELP_COMMAND_ID = `${EXTENSION_ID}.go-to-extension-marketplace-help`;

export const GO_TO_ENTERPRISE_GROUP_COMMAND_ID = `${EXTENSION_ID}.go-to-enterprise-group`;

export const SHARE_YOUR_FEEDBACK_COMMAND_ID = `${EXTENSION_ID}.share-your-feedback`;

export const SHOW_LOGS_COMMAND_ID = `${EXTENSION_ID}.show-logs`;

// region: internal commands -------------------------------------------

export const OPEN_REMOTE_WINDOW_COMMAND_ID = `${EXTENSION_ID}.open-remote-window`;

export const RELOAD_COMMAND_ID = `${EXTENSION_ID}.reload`;

export const RELOAD_WITH_WARNING_COMMAND_ID = `${EXTENSION_ID}.reload-with-warning`;

// region: source control-----------------------------------------------

export const SOURCE_CONTROL_CHANGES_ID = 'changes';
export const SOURCE_CONTROL_CHANGES_NAME = 'Changes';

export const SOURCE_CONTROL_ID = 'web-ide';
export const SOURCE_CONTROL_NAME = 'Web IDE';

// region: UI elements --------------------------------------------------

export const BRANCH_STATUS_BAR_ITEM_ID = 'branchStatusBarItem';
export const BRANCH_STATUS_BAR_ITEM_PRIORITY = 50;

// region: Context
export const WEB_IDE_READY_CONTEXT_ID = 'khulnasoft-web-ide.is-ready';
export const MERGE_REQUEST_FILE_PATHS_CONTEXT_ID = 'khulnasoft-web-ide.mergeRequestFilePaths';
export const MARKETPLACE_DISABLED_CONTEXT_ID = 'khulnasoft-web-ide.marketplace-disabled';

// region: Micellaneous -------------------------------------------------------
export const FEEDBACK_ISSUE_URL = 'https://gitlab.com/gitlab-org/gitlab/-/issues/385787';
export const MARKETPLACE_DISABLED_VIEW_ENTERPRISE_GROUP = 'enterprise-group';
export const MARKETPLACE_DISABLED_VIEW_OPT_IN = 'opt-in';
export const MARKETPLACE_DISABLED_VIEW_WITH_DOCS = 'with-docs';
export const MARKETPLACE_DISABLED_VIEW_DEFAULT = 'default';

// region: Local storage ------------------------------------------------------
export const COMMIT_TO_DEFAULT_BRANCH_PREFERENCE = 'commit-to-default-branch';

// region: VSCode constants --------------------------------------------

export const VSCODE_COMMAND_OPEN_WALKTHROUGH = 'workbench.action.openWalkthrough';
export const VSCODE_COMMAND_KEEP_EDITOR = 'workbench.action.keepEditor';

export const VSCODE_STARTUP_EDITOR_WELCOME_PAGE = 'welcomePage';
