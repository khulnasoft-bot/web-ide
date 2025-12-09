import type { GitLabRef } from '@khulnasoft/vscode-mediator-commands';
import * as vscode from 'vscode';
import {
  BRANCH_STATUS_BAR_ITEM_ID,
  BRANCH_STATUS_BAR_ITEM_PRIORITY,
  CHECKOUT_BRANCH_COMMAND_ID,
} from '../constants';
import { getRefName } from '../utils/getRefName';

export const initBranchStatusBarItem = (disposables: vscode.Disposable[], ref: GitLabRef) => {
  const name = getRefName(ref);

  // note: Even if the branch is empty (i.e. an empty_repo project), the name should be populated.
  const branchStatusBarItem = vscode.window.createStatusBarItem(
    BRANCH_STATUS_BAR_ITEM_ID,
    vscode.StatusBarAlignment.Left,
    BRANCH_STATUS_BAR_ITEM_PRIORITY,
  );

  branchStatusBarItem.accessibilityInformation = {
    label: name,
  };
  branchStatusBarItem.text = `$(git-branch) ${name}`;
  branchStatusBarItem.command = CHECKOUT_BRANCH_COMMAND_ID;
  branchStatusBarItem.show();

  disposables.push(branchStatusBarItem);

  return branchStatusBarItem;
};
