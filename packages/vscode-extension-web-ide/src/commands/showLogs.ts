import * as vscode from 'vscode';
import { SHOW_LOGS_COMMAND_ID } from '../constants';

export const registerShowLogsCommand = (outputChannel: vscode.OutputChannel) =>
  vscode.commands.registerCommand(SHOW_LOGS_COMMAND_ID, () => outputChannel.show());
