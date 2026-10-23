import * as vscode from 'vscode';
import {
  VSCODE_COMMAND_GET_RECENTLY_OPENED,
  VSCODE_COMMAND_REMOVE_FROM_RECENTLY_OPENED,
  MAX_RECENT_WORKSPACES,
} from './constants';
import { limitRecentWorkspaces } from './limitRecentWorkspaces';
import { log } from './utils';

describe('limitRecentWorkspaces', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when recently opened data is undefined or null', async () => {
    jest.mocked(vscode.commands.executeCommand).mockResolvedValueOnce(undefined);

    await limitRecentWorkspaces();

    expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(1);
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(VSCODE_COMMAND_GET_RECENTLY_OPENED);
  });

  it('does nothing when workspaces list is empty or within max limit', async () => {
    const workspaces = [
      { folderUri: 'gitlab-web-ide:///project-1' },
      { folderUri: 'gitlab-web-ide:///project-2' },
    ];

    jest.mocked(vscode.commands.executeCommand).mockResolvedValueOnce({
      workspaces,
    });

    await limitRecentWorkspaces(10);

    expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(1);
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(VSCODE_COMMAND_GET_RECENTLY_OPENED);
  });

  it('removes excess workspaces when count exceeds limit', async () => {
    const workspaces = Array.from({ length: 15 }, (_, i) => ({
      folderUri: `gitlab-web-ide:///project-${i + 1}`,
    }));

    jest.mocked(vscode.commands.executeCommand).mockResolvedValueOnce({
      workspaces,
    });

    await limitRecentWorkspaces(10);

    // 1 call to getRecentlyOpened + 5 calls to removeFromRecentlyOpened
    expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(6);
    expect(vscode.commands.executeCommand).toHaveBeenNthCalledWith(
      1,
      VSCODE_COMMAND_GET_RECENTLY_OPENED,
    );

    for (let i = 10; i < 15; i += 1) {
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        VSCODE_COMMAND_REMOVE_FROM_RECENTLY_OPENED,
        `gitlab-web-ide:///project-${i + 1}`,
      );
    }
  });

  it('handles workspaces given as strings, Uris, or workspace config objects', async () => {
    const uriObj = vscode.Uri.parse('gitlab-web-ide:///project-uri');
    const workspaces = [
      'gitlab-web-ide:///project-1',
      { workspace: { configPath: 'gitlab-web-ide:///workspace.code-workspace' } },
      uriObj,
    ];

    jest.mocked(vscode.commands.executeCommand).mockResolvedValueOnce({
      workspaces,
    });

    await limitRecentWorkspaces(1);

    expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(3);
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
      VSCODE_COMMAND_REMOVE_FROM_RECENTLY_OPENED,
      'gitlab-web-ide:///workspace.code-workspace',
    );
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
      VSCODE_COMMAND_REMOVE_FROM_RECENTLY_OPENED,
      uriObj,
    );
  });

  it('uses MAX_RECENT_WORKSPACES as default limit', async () => {
    const workspaces = Array.from({ length: MAX_RECENT_WORKSPACES + 3 }, (_, i) => ({
      folderUri: `gitlab-web-ide:///project-${i + 1}`,
    }));

    jest.mocked(vscode.commands.executeCommand).mockResolvedValueOnce({
      workspaces,
    });

    await limitRecentWorkspaces();

    expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(4);
    for (let i = MAX_RECENT_WORKSPACES; i < MAX_RECENT_WORKSPACES + 3; i += 1) {
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        VSCODE_COMMAND_REMOVE_FROM_RECENTLY_OPENED,
        `gitlab-web-ide:///project-${i + 1}`,
      );
    }
  });

  it('handles and logs errors gracefully without throwing', async () => {
    const warnSpy = jest.spyOn(log, 'warn').mockImplementation(() => {});
    const error = new Error('Command failed');
    jest.mocked(vscode.commands.executeCommand).mockRejectedValueOnce(error);

    await expect(limitRecentWorkspaces()).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalledWith(
      '[gitlab-web-ide] Failed to limit recent workspaces:',
      error,
    );
    warnSpy.mockRestore();
  });
});
