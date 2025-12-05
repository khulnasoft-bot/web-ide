import * as vscode from 'vscode';
import { getConfig } from '../../mediator';
import { generateBranchName } from './generateBranchName';

export interface BranchSelection {
  readonly isNewBranch: boolean;
  readonly branchName: string;
}

/**
 * Prompts the user for a branch name and returns a promise resolving
 * with their selection (or undefined if the user canceled).
 */
export const promptBranchName = async (refName: string): Promise<BranchSelection | undefined> => {
  // TODO: Hopefully we can abstract state into something that can be made
  //       reactive and easily provided/injected.
  const { username } = await getConfig();
  const generatedBranchName = generateBranchName(refName, username);

  const userNewBranchName = await vscode.window.showInputBox({
    ignoreFocusOut: true,
    placeHolder: `Leave empty to use "${generatedBranchName}"`,
    title: 'Create a new branch and commit',
  });

  // Did the user just escape it?
  if (userNewBranchName === undefined) {
    return undefined;
  }

  return {
    isNewBranch: true,
    branchName: userNewBranchName || generatedBranchName,
  };
};
