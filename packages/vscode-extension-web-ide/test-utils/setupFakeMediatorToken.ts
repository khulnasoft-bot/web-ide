import { COMMAND_MEDIATOR_TOKEN } from '@gitlab/web-ide-interop';
import * as vscode from 'vscode';

export const setupFakeMediatorToken = (token: string) => {
  jest.mocked(vscode.commands.executeCommand).mockImplementation(command => {
    if (command === COMMAND_MEDIATOR_TOKEN) {
      return Promise.resolve(token);
    }

    return Promise.resolve();
  });
};
