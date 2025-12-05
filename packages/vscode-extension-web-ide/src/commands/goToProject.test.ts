import * as vscode from 'vscode';
import { TEST_COMMANDS_INITIAL_DATA } from '../../test-utils';
import goToProject from './goToProject';

describe('commands/goToProject', () => {
  it('opens project web url in an external window', async () => {
    await goToProject(Promise.resolve(TEST_COMMANDS_INITIAL_DATA))();

    expect(vscode.env.openExternal).toHaveBeenCalledWith(
      vscode.Uri.parse(TEST_COMMANDS_INITIAL_DATA.project.web_url),
    );
  });
});
