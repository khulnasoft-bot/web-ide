import * as vscode from 'vscode';
import { GET_STARTED_WALKTHROUGH_ID, VSCODE_COMMAND_OPEN_WALKTHROUGH } from './constants';
import { openWalkthrough } from './openWalkthrough';

describe('openWalkthrough', () => {
  const workbenchConfiguration: vscode.WorkspaceConfiguration = {
    get: jest.fn(),
  } as unknown as vscode.WorkspaceConfiguration;

  beforeEach(() => {
    jest.mocked(vscode.workspace.getConfiguration).mockReturnValue(workbenchConfiguration);
  });

  describe('when workbench.startupEditor config is none', () => {
    beforeEach(async () => {
      jest.mocked(workbenchConfiguration.get).mockReturnValue('none');

      await openWalkthrough();
    });

    it('does nothing', () => {
      expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
    });

    it('requests workbench.startupEditor config', () => {
      expect(vscode.workspace.getConfiguration).toHaveBeenCalledTimes(1);
      expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith('workbench');
      expect(workbenchConfiguration.get).toHaveBeenCalledTimes(1);
      expect(workbenchConfiguration.get).toHaveBeenCalledWith('startupEditor');
    });
  });

  describe('when workbench.startupEditor config is welcomePage', () => {
    beforeEach(async () => {
      jest.mocked(workbenchConfiguration.get).mockReturnValue('welcomePage');

      await openWalkthrough();
    });

    it('opens Web IDE walkthrough', () => {
      expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(1);
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        VSCODE_COMMAND_OPEN_WALKTHROUGH,
        GET_STARTED_WALKTHROUGH_ID,
      );
    });
  });
});
