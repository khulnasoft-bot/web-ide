import * as vscode from 'vscode';
import { TEST_COMMANDS_INITIAL_DATA } from '../../test-utils';
import openRemoteWindow from './openRemoteWindow';
import {
  GO_TO_PROJECT_COMMAND_ID,
  GO_TO_GITLAB_COMMAND_ID,
  SHARE_YOUR_FEEDBACK_COMMAND_ID,
} from '../constants';

describe('commands/openRemoteWindow', () => {
  describe('default (when user cancels)', () => {
    beforeEach(async () => {
      jest.mocked(vscode.window.showQuickPick).mockResolvedValue(undefined);

      await openRemoteWindow(Promise.resolve(TEST_COMMANDS_INITIAL_DATA))();
    });

    it('shows quick pick', async () => {
      expect(vscode.window.showQuickPick).toHaveBeenCalledWith(expect.any(Object), {
        canPickMany: false,
        ignoreFocusOut: false,
        matchOnDescription: false,
        matchOnDetail: false,
      });

      const items = await (vscode.window.showQuickPick as jest.Mock).mock.calls[0][0];

      expect(items).toEqual([
        {
          alwaysShow: true,
          command: GO_TO_PROJECT_COMMAND_ID,
          label: expect.any(String),
        },
        {
          alwaysShow: true,
          command: GO_TO_GITLAB_COMMAND_ID,
          label: expect.any(String),
        },
        {
          alwaysShow: true,
          command: SHARE_YOUR_FEEDBACK_COMMAND_ID,
          label: expect.any(String),
        },
      ]);
    });

    it('does not execute any command', () => {
      expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
    });
  });

  describe('when user selects item', () => {
    beforeEach(async () => {
      (vscode.window.showQuickPick as jest.Mock).mockResolvedValue({
        label: 'Go to project',
        alwaysShow: true,
        command: GO_TO_PROJECT_COMMAND_ID,
      });

      await openRemoteWindow(Promise.resolve(TEST_COMMANDS_INITIAL_DATA))();
    });

    it('executes action item command', () => {
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(GO_TO_PROJECT_COMMAND_ID);
    });
  });
});
