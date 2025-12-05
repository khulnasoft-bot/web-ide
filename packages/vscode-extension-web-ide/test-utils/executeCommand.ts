import * as vscode from 'vscode';

export const executeCommand = (command: string, ...args: unknown[]) => {
  const registerCommandArgs = jest
    .mocked(vscode.commands.registerCommand)
    .mock.calls.find(([name]) => name === command);

  if (!registerCommandArgs) {
    throw new Error(`Command not registered (${command})`);
  }

  return registerCommandArgs[1](...args);
};
