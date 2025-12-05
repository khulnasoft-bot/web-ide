import * as vscode from 'vscode';
import {
  GET_STARTED_WALKTHROUGH_ID,
  VSCODE_COMMAND_OPEN_WALKTHROUGH,
  VSCODE_STARTUP_EDITOR_WELCOME_PAGE,
} from './constants';

export async function openWalkthrough() {
  if (
    vscode.workspace.getConfiguration('workbench').get('startupEditor') ===
    VSCODE_STARTUP_EDITOR_WELCOME_PAGE
  ) {
    await vscode.commands.executeCommand(
      VSCODE_COMMAND_OPEN_WALKTHROUGH,
      GET_STARTED_WALKTHROUGH_ID,
    );
  }
}
