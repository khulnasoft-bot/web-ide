import * as vscode from 'vscode';
import type { CommandsInitialData } from '../types';

export default (data: Thenable<CommandsInitialData>) => async () => {
  const { gitlabUrl } = await data;

  if (gitlabUrl) {
    await vscode.env.openExternal(vscode.Uri.parse(gitlabUrl));
  }
};
