import * as vscode from 'vscode';
import { RELOAD_COMMAND_ID } from '../constants';

export interface ReloadWithWarningCommandOptions {
  message: string;
  ref: string;
  okText: string;
}

export default async ({ message, ref, okText }: ReloadWithWarningCommandOptions) => {
  const item = await vscode.window.showWarningMessage(message, { modal: true }, okText);

  if (item === okText) {
    await vscode.commands.executeCommand(RELOAD_COMMAND_ID, { ref });
  }
};
