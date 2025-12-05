import * as vscode from 'vscode';
import type { CommandsInitialData } from '../types';

export default (data: Thenable<CommandsInitialData>) => async () => {
  const { project } = await data;

  await vscode.env.openExternal(vscode.Uri.parse(project.web_url));
};
