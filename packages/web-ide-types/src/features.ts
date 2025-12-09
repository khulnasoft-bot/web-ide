export enum FeatureFlags {
  // projectPushRules -
  // This WIP feature flag enables the project push rule detection feature for
  // commit message linting based on the project's configured push rules.
  // See https://gitlab.com/khulnasoft/web-ide/-/issues/388
  ProjectPushRules = 'projectPushRules',

  // languageServerWebIDE -
  // This WIP feature flag controls the availability of the Language Server used
  // in the GitLab Workflow VSCode Extension.
  // See https://gitlab.com/groups/gitlab-org/-/epics/14203
  LanguageServerWebIDE = 'languageServerWebIDE',

  // additionalSourceControlOperations -
  // This WIP feature flag controls the availability of additional source control
  // operations in the Web IDE, such as stashing changes.
  // https://gitlab.com/groups/gitlab-org/-/epics/11142
  AdditionalSourceControlOperations = 'additionalSourceControlOperations',
}
