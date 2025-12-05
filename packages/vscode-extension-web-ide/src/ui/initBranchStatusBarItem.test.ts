import * as vscode from 'vscode';
import { initBranchStatusBarItem } from './initBranchStatusBarItem';
import { asRef, TEST_BRANCH } from '../../test-utils';
import {
  BRANCH_STATUS_BAR_ITEM_ID,
  BRANCH_STATUS_BAR_ITEM_PRIORITY,
  CHECKOUT_BRANCH_COMMAND_ID,
} from '../constants';

describe('ui/initCommitAuthorStatusBarItem', () => {
  let statusBarItem: vscode.StatusBarItem | undefined;
  const disposables: vscode.Disposable[] = [];

  beforeEach(() => {
    (vscode.window.createStatusBarItem as jest.Mock).mockImplementationOnce(
      (id: 'string', alignment: vscode.StatusBarAlignment, priority: number | undefined) => ({
        id,
        alignment,
        priority,
        show: jest.fn(),
      }),
    );
  });

  describe('when working on an existing branch', () => {
    beforeEach(() => {
      statusBarItem = initBranchStatusBarItem(disposables, asRef(TEST_BRANCH));
    });

    it('creates a status bar item', () => {
      const { name } = TEST_BRANCH;

      expect(statusBarItem).toEqual({
        id: BRANCH_STATUS_BAR_ITEM_ID,
        alignment: vscode.StatusBarAlignment.Left,
        command: CHECKOUT_BRANCH_COMMAND_ID,
        priority: BRANCH_STATUS_BAR_ITEM_PRIORITY,
        text: `$(git-branch) ${name}`,
        accessibilityInformation: {
          label: name,
        },
        show: expect.any(Function),
      });
    });

    it('shows the status bar item', () => {
      expect(statusBarItem?.show).toHaveBeenCalled();
    });

    it('adds status bar item to the disposables collection', () => {
      expect(disposables).toContain(statusBarItem);
    });
  });
});
