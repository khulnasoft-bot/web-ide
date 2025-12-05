import * as vscode from 'vscode';
import { TEST_COMMANDS_INITIAL_DATA } from '../../test-utils';
import goToGitLab from './goToGitLab';

describe('commands/goToGitLab', () => {
  describe('when gitlab URL is available', () => {
    it('opens gitlab url in an external window', async () => {
      await goToGitLab(Promise.resolve(TEST_COMMANDS_INITIAL_DATA))();

      expect(vscode.env.openExternal).toHaveBeenCalledWith(
        vscode.Uri.parse(TEST_COMMANDS_INITIAL_DATA.gitlabUrl || ''),
      );
    });
  });
});
