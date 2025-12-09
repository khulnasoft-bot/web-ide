import * as vscode from 'vscode';

import type { SourceControlSystem } from '@khulnasoft/web-ide-fs';
import type { DefaultGitLabClient } from '@gitlab/gitlab-api-client';

import {
  CHECKOUT_BRANCH_COMMAND_ID,
  CREATE_BRANCH_COMMAND_ID,
  CREATE_BRANCH_FROM_BASE_COMMAND_ID,
  DELETE_BRANCH_COMMAND_ID,
  GO_TO_GITLAB_COMMAND_ID,
  GO_TO_PROJECT_COMMAND_ID,
  SHARE_YOUR_FEEDBACK_COMMAND_ID,
  OPEN_REMOTE_WINDOW_COMMAND_ID,
  RELOAD_WITH_WARNING_COMMAND_ID,
  COMPARE_WITH_MR_BASE_COMMAND_ID,
} from '../constants';
import type { CommandsInitialData } from '../types';
import checkoutBranch from './checkoutBranch';
import createBranch from './createBranch';
import deleteBranch from './deleteBranch';
import compareWithMrBase from './compareWithMrBase';
import goToKhulnaSoft from './goToGitLab';
import goToProject from './goToProject';
import shareYourFeedback from './shareYourFeedback';
import openRemoteWindow from './openRemoteWindow';
import reloadWithWarning from './reloadWithWarning';

export const registerCommands = (
  disposables: vscode.Disposable[],
  dataPromise: Thenable<CommandsInitialData>,
  sourceControl: SourceControlSystem,
  apiClient: DefaultGitLabClient,
) => {
  disposables.push(
    vscode.commands.registerCommand(
      CHECKOUT_BRANCH_COMMAND_ID,
      checkoutBranch(dataPromise, sourceControl),
    ),
    vscode.commands.registerCommand(
      CREATE_BRANCH_COMMAND_ID,
      createBranch({ asyncOptions: dataPromise, sourceControl, showBaseBranchSelection: false }),
    ),
    vscode.commands.registerCommand(
      CREATE_BRANCH_FROM_BASE_COMMAND_ID,
      createBranch({ asyncOptions: dataPromise, sourceControl, showBaseBranchSelection: true }),
    ),
    vscode.commands.registerCommand(
      DELETE_BRANCH_COMMAND_ID,
      deleteBranch({ asyncOptions: dataPromise, sourceControl, apiClient }),
    ),
    vscode.commands.registerCommand(COMPARE_WITH_MR_BASE_COMMAND_ID, compareWithMrBase),
    vscode.commands.registerCommand(GO_TO_GITLAB_COMMAND_ID, goToGitLab(dataPromise)),
    vscode.commands.registerCommand(GO_TO_PROJECT_COMMAND_ID, goToProject(dataPromise)),
    vscode.commands.registerCommand(OPEN_REMOTE_WINDOW_COMMAND_ID, openRemoteWindow(dataPromise)),
    vscode.commands.registerCommand(SHARE_YOUR_FEEDBACK_COMMAND_ID, shareYourFeedback),
    vscode.commands.registerCommand(RELOAD_WITH_WARNING_COMMAND_ID, reloadWithWarning),
  );
};
