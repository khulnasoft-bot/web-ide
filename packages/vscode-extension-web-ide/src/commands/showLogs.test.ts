import * as vscode from 'vscode';
import { registerShowLogsCommand } from './showLogs';
import { createFakePartial } from '../../test-utils/createFakePartial';
import { executeCommand } from '../../test-utils/executeCommand';
import { SHOW_LOGS_COMMAND_ID } from '../constants';

describe('commands/showLogs', () => {
  let outputChannel: vscode.OutputChannel;
  let subject: vscode.Disposable;

  beforeEach(() => {
    jest.mocked(vscode.commands.registerCommand).mockImplementation(() => ({ dispose: jest.fn() }));

    outputChannel = createFakePartial<vscode.OutputChannel>({
      show: jest.fn(),
    });
    subject = registerShowLogsCommand(outputChannel);
  });

  it('returns disposable from register command', () => {
    expect(subject).toBeDefined();
    expect(subject).toBe(jest.mocked(vscode.commands.registerCommand).mock.results[0].value);
  });

  it('shows output channel when command is called', () => {
    expect(outputChannel.show).not.toHaveBeenCalled();

    executeCommand(SHOW_LOGS_COMMAND_ID);

    expect(outputChannel.show).toHaveBeenCalled();
  });
});
