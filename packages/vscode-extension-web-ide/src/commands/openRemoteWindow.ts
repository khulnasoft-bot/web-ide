import * as vscode from 'vscode';
import {
  GO_TO_PROJECT_COMMAND_ID,
  GO_TO_GITLAB_COMMAND_ID,
  SHARE_YOUR_FEEDBACK_COMMAND_ID,
} from '../constants';
import type { CommandsInitialData } from '../types';

const buildActionMenuItem = (command: string, label: string) => ({
  alwaysShow: true,
  command,
  label,
});

const buildActionMenuItems = async (commandsDataPromise: Thenable<CommandsInitialData>) => {
  const { project } = await commandsDataPromise;

  return [
    buildActionMenuItem(GO_TO_PROJECT_COMMAND_ID, `Go to ${project.name} project on GitLab`),
    buildActionMenuItem(GO_TO_GITLAB_COMMAND_ID, 'Go to GitLab'),
    buildActionMenuItem(SHARE_YOUR_FEEDBACK_COMMAND_ID, 'Share your feedback'),
  ];
};

export default (commandsDataPromise: Thenable<CommandsInitialData>) => async () => {
  const selection = await vscode.window.showQuickPick(buildActionMenuItems(commandsDataPromise), {
    canPickMany: false,
    ignoreFocusOut: false,
    matchOnDescription: false,
    matchOnDetail: false,
  });

  if (!selection) {
    return;
  }

  await vscode.commands.executeCommand(selection.command);
};
