import * as vscode from 'vscode';
import type { FileStatus } from '@khulnasoft/web-ide-fs';
import type { GitLabProject, GitLabRef } from '@khulnasoft/vscode-mediator-commands';
import type { WebIdeConfig } from '@khulnasoft/web-ide-types';
import { lintCommit } from './commit/lintCommit';
import {
  COMMIT_COMMAND_ID,
  COMMIT_COMMAND_TEXT,
  SECONDARY_COMMIT_COMMAND_TEXT,
  SOURCE_CONTROL_ID,
  SOURCE_CONTROL_NAME,
  SOURCE_CONTROL_CHANGES_NAME,
  SOURCE_CONTROL_CHANGES_ID,
  COMMIT_AND_FORCE_PUSH_COMMAND_ID,
  COMMIT_AND_FORCE_PUSH_COMMAND_TEXT,
  FS_SCHEME,
  COMMIT_AMEND_AND_FORCE_PUSH_COMMAND_TEXT,
  COMMIT_AMEND_AND_FORCE_PUSH_COMMAND_ID,
} from '../constants';
import { ResourceDecorationProvider } from './ResourceDecorationProvider';
import { fromUriToScmUri } from './uri';
import { createStatusViewModel, toResourceState } from './status';
import type { SourceControlViewModel } from './types';

interface SourceControlViewModelOptions {
  repoRoot: string;
  sourceControl: vscode.SourceControl;
  changesGroup: vscode.SourceControlResourceGroup;
  resourceDecorationProvider: ResourceDecorationProvider;
}

class DefaultSourceControlViewModel implements SourceControlViewModel {
  readonly #repoRoot: string;

  readonly #sourceControl: vscode.SourceControl;

  readonly #changesGroup: vscode.SourceControlResourceGroup;

  readonly #resourceDecorationProvider: ResourceDecorationProvider;

  #lastStatus: FileStatus[];

  constructor({
    repoRoot,
    sourceControl,
    changesGroup,
    resourceDecorationProvider,
  }: SourceControlViewModelOptions) {
    this.#repoRoot = repoRoot;
    this.#sourceControl = sourceControl;
    this.#changesGroup = changesGroup;
    this.#resourceDecorationProvider = resourceDecorationProvider;

    this.#lastStatus = [];
  }

  getStatus() {
    return this.#lastStatus;
  }

  getCommitMessage() {
    return this.#sourceControl.inputBox.value;
  }

  update(statuses: FileStatus[]) {
    this.#lastStatus = statuses;

    const statusVms = statuses.map(x => createStatusViewModel(x, this.#repoRoot));

    // why: It might be important to update the resource decorations first before
    // adding the resources themselves to the resource group.
    this.#resourceDecorationProvider.update(statusVms);
    this.#changesGroup.resourceStates = statusVms.map(statusVm => toResourceState(statusVm));
  }
}

const sourceControlSecondaryCommand = {
  title: SECONDARY_COMMIT_COMMAND_TEXT,
  command: COMMIT_COMMAND_ID,
  arguments: [
    {
      shouldPromptBranchName: true,
    },
  ],
};
const sourceControlCommitForcePushCommand = {
  title: COMMIT_AND_FORCE_PUSH_COMMAND_TEXT,
  command: COMMIT_AND_FORCE_PUSH_COMMAND_ID,
  arguments: [],
};
const sourceControlCommitAmendForcePushCommand = {
  title: COMMIT_AMEND_AND_FORCE_PUSH_COMMAND_TEXT,
  command: COMMIT_AMEND_AND_FORCE_PUSH_COMMAND_ID,
  arguments: [],
};

const getCommands = (ref: GitLabRef, project: GitLabProject, config: WebIdeConfig) => {
  if (ref.type === 'branch') {
    const secondaryCommands = [];
    if (!project.empty_repo) {
      secondaryCommands.push([sourceControlSecondaryCommand]);
      if (config.featureFlags?.additionalSourceControlOperations) {
        secondaryCommands.push([sourceControlCommitForcePushCommand]);
        secondaryCommands.push([sourceControlCommitAmendForcePushCommand]);
      }
    }
    return {
      primaryCommand: {
        command: COMMIT_COMMAND_ID,
        title: `${COMMIT_COMMAND_TEXT} to '${ref.branch.name}'`,
        arguments: [],
      },
      secondaryCommands: secondaryCommands.length > 0 ? secondaryCommands : undefined,
    };
  }

  return {
    primaryCommand: sourceControlSecondaryCommand,
    secondaryCommands: undefined,
  };
};

const createVSCodeSourceControl = (
  disposables: vscode.Disposable[],
  ref: GitLabRef,
  project: GitLabProject,
  config: WebIdeConfig,
) => {
  const sourceControl = vscode.scm.createSourceControl(SOURCE_CONTROL_ID, SOURCE_CONTROL_NAME);
  const { primaryCommand, secondaryCommands } = getCommands(ref, project, config);

  disposables.push(sourceControl);

  sourceControl.acceptInputCommand = primaryCommand;
  sourceControl.inputBox.enabled = true;

  if (project.push_rules) {
    const pushRules = project.push_rules;
    sourceControl.inputBox.validateInput = () => {
      const commitMessage = lintCommit({
        value: sourceControl.inputBox.value,
        pushRules,
      });

      return {
        message: commitMessage,
        type: vscode.SourceControlInputBoxValidationType.Warning,
      };
    };
  }

  sourceControl.inputBox.placeholder = 'Commit message';
  sourceControl.actionButton = {
    description: primaryCommand.title,
    enabled: true,
    secondaryCommands,
    command: primaryCommand,
  };
  sourceControl.quickDiffProvider = {
    provideOriginalResource(uri: vscode.Uri): vscode.Uri | undefined {
      if (uri.scheme === FS_SCHEME) {
        return fromUriToScmUri(uri, '');
      }

      return undefined;
    },
  };

  return sourceControl;
};

const createVSCodeChangesResourceGroup = (
  disposables: vscode.Disposable[],
  sourceControl: vscode.SourceControl,
) => {
  const changesGroup = sourceControl.createResourceGroup(
    SOURCE_CONTROL_CHANGES_ID,
    SOURCE_CONTROL_CHANGES_NAME,
  );
  changesGroup.hideWhenEmpty = false;
  disposables.push(changesGroup);

  return changesGroup;
};

const createResourceDecorationProvider = (disposables: vscode.Disposable[]) => {
  const resourceDecorationProvider = new ResourceDecorationProvider();

  disposables.push(
    vscode.window.registerFileDecorationProvider(
      resourceDecorationProvider.createVSCodeDecorationProvider(),
    ),
  );

  return resourceDecorationProvider;
};

export const createSourceControlViewModel = (
  disposables: vscode.Disposable[],
  repoRoot: string,
  ref: GitLabRef,
  project: GitLabProject,
  config: WebIdeConfig,
): SourceControlViewModel => {
  const sourceControl = createVSCodeSourceControl(disposables, ref, project, config);
  const changesGroup = createVSCodeChangesResourceGroup(disposables, sourceControl);
  const resourceDecorationProvider = createResourceDecorationProvider(disposables);

  return new DefaultSourceControlViewModel({
    repoRoot,
    sourceControl,
    changesGroup,
    resourceDecorationProvider,
  });
};
