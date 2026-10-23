import * as vscode from 'vscode';
import {
  VSCODE_COMMAND_GET_RECENTLY_OPENED,
  VSCODE_COMMAND_REMOVE_FROM_RECENTLY_OPENED,
  MAX_RECENT_WORKSPACES,
} from './constants';
import { log } from './utils';

export interface RecentWorkspaceItem {
  folderUri?: vscode.Uri | string;
  workspace?: {
    id?: string;
    configPath?: vscode.Uri | string;
  };
  fileUri?: vscode.Uri | string;
  label?: string;
}

export interface RecentlyOpenedData {
  workspaces?: (RecentWorkspaceItem | vscode.Uri | string)[];
  files?: (RecentWorkspaceItem | vscode.Uri | string)[];
}

const getWorkspaceTarget = (
  item: RecentWorkspaceItem | vscode.Uri | string,
): vscode.Uri | string | undefined => {
  if (typeof item === 'string' || item instanceof vscode.Uri) {
    return item;
  }

  return item?.folderUri || item?.workspace?.configPath || item?.fileUri;
};

/**
 * Caps the number of recent workspaces in the workbench's recently opened list.
 * This prevents `recently.opened` in global state and settings sync from
 * growing unbounded and violating backend size constraints.
 *
 * @param max The maximum number of recent workspaces to retain (defaults to MAX_RECENT_WORKSPACES = 100).
 */
export async function limitRecentWorkspaces(max = MAX_RECENT_WORKSPACES): Promise<void> {
  try {
    const recentlyOpened = await vscode.commands.executeCommand<RecentlyOpenedData>(
      VSCODE_COMMAND_GET_RECENTLY_OPENED,
    );

    if (!recentlyOpened || !Array.isArray(recentlyOpened.workspaces)) {
      return;
    }

    const { workspaces } = recentlyOpened;

    if (workspaces.length <= max) {
      return;
    }

    const excessWorkspaces = workspaces.slice(max);

    for (const workspace of excessWorkspaces) {
      const target = getWorkspaceTarget(workspace);

      if (target) {
        // eslint-disable-next-line no-await-in-loop
        await vscode.commands.executeCommand(VSCODE_COMMAND_REMOVE_FROM_RECENTLY_OPENED, target);
      }
    }
  } catch (error) {
    log.warn('[gitlab-web-ide] Failed to limit recent workspaces:', error);
  }
}
