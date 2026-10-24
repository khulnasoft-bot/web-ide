import * as vscode from 'vscode';
import type { GitLabProject, GitLabRef } from '@khulnasoft/vscode-mediator-commands';
import { COMMIT_TO_DEFAULT_BRANCH_PREFERENCE } from '../../constants';
import { promptBranchName } from './promptBranchName';
import type { LocalStorage } from '../../types';
import { getRefName } from '../../utils/getRefName';

interface GetBranchSelectionOptions {
  project: GitLabProject;
  ref: GitLabRef;
  localStorage: LocalStorage;
  shouldPromptBranchName?: boolean;
}

interface ValidBranchSelection {
  isNewBranch: boolean;
  branchName: string;
}

export type BranchSelection = ValidBranchSelection | undefined;

export const CREATE_NEW_BRANCH_OPTION = 'Create new branch';
export const CONTINUE_OPTION = 'Continue';

export const getBranchSelection = async ({
  project,
  ref,
  shouldPromptBranchName = false,
  localStorage,
}: GetBranchSelectionOptions): Promise<BranchSelection> => {
  const commitToDefaultBranchPreferenceKey = `${COMMIT_TO_DEFAULT_BRANCH_PREFERENCE}.${project.id}`;

  if (ref.type !== 'branch' || shouldPromptBranchName) {
    const refName = getRefName(ref);

    return promptBranchName(refName);
  }

  const { branch } = ref;

  if (project.empty_repo) {
    return { isNewBranch: false, branchName: branch.name };
  }

  if (!branch.can_push) {
    const choice = await vscode.window.showErrorMessage(
      `You can't push to the ${branch.name} branch. Do you want to commit your changes to a new branch?`,
      { modal: true },
      CREATE_NEW_BRANCH_OPTION,
    );

    if (choice === CREATE_NEW_BRANCH_OPTION) {
      return promptBranchName(branch.name);
    }

    return undefined;
  }

  if (branch.default && !localStorage.get(commitToDefaultBranchPreferenceKey, false)) {
    const choice = await vscode.window.showWarningMessage(
      `You're committing your changes to the default branch. Do you want to continue?`,
      { modal: true },
      CONTINUE_OPTION,
      CREATE_NEW_BRANCH_OPTION,
    );

    if (choice === CONTINUE_OPTION) {
      await localStorage.update(commitToDefaultBranchPreferenceKey, true);

      return { isNewBranch: false, branchName: branch.name };
    }

    if (choice === CREATE_NEW_BRANCH_OPTION) {
      return promptBranchName(branch.name);
    }

    return undefined;
  }

  return { isNewBranch: false, branchName: branch.name };
};
