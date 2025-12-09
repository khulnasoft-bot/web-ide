import type { SourceControlSystem } from '@khulnasoft/web-ide-fs';
import { flatten, uniq } from 'lodash';
import * as vscode from 'vscode';
import type { GitLabProject } from '@khulnasoft/vscode-mediator-commands';
import { RELOAD_COMMAND_ID, RELOAD_WITH_WARNING_COMMAND_ID } from '../constants';
import { createProjectBranch, fetchProjectBranches } from '../mediator';
import type { CommandsInitialData } from '../types';
import { showInputBox, showSearchableQuickPick } from '../vscodeUi';

// region: types -------------------------------------------------------
interface NewBranchQuickPickItem extends vscode.QuickPickItem {
  type: 'new-branch';
}

interface NotFoundQuickPickItem extends vscode.QuickPickItem {
  type: 'not-found';
}
interface ExistingBranchQuickPickItem extends vscode.QuickPickItem {
  type: 'existing-branch';
  ref: string;
}
interface CurrentBranchQuickPickItem extends vscode.QuickPickItem {
  type: 'current';
  ref: string;
}
export type BranchQuickPickItem =
  | NewBranchQuickPickItem
  | ExistingBranchQuickPickItem
  | NotFoundQuickPickItem
  | CurrentBranchQuickPickItem;

// region: branch filtering options ----------------------------------------

export const ITEM_NOT_FOUND: NotFoundQuickPickItem = {
  type: 'not-found',
  alwaysShow: true,
  label: 'No branches found',
};

export const ITEM_CREATE_NEW: BranchQuickPickItem = {
  type: 'new-branch',
  alwaysShow: true,
  label: '$(plus) Create new branch...',
};
// region: core helper functions ---------------------------------------
const createCurrentBranchItem = (currentBranch: string): CurrentBranchQuickPickItem => ({
  type: 'current',
  label: `$(git-branch) ${currentBranch} (current)`,
  description: 'Current branch',
  ref: currentBranch,
  alwaysShow: true,
});

export const mapBranchNameToQuickPickItem = (branchName: string): ExistingBranchQuickPickItem => ({
  type: 'existing-branch',
  alwaysShow: false,
  label: `$(git-branch) ${branchName}`,
  ref: branchName,
});

const tryCreateProjectBranch = async (...args: Parameters<typeof createProjectBranch>) => {
  try {
    return await createProjectBranch(...args);
  } catch {
    return {
      errors: ['An unexpected error occurred while creating the branch. Please try again.'],
    };
  }
};

export const handleSearchError = async (e: unknown): Promise<void> => {
  // eslint-disable-next-line no-console
  console.error('[gitlab-webide] Error occurred while searching for branches', e);

  await vscode.window.showWarningMessage(
    'Error while searching for branches. Please try again or check the developer console for details.',
  );
};

// region: branch search functions------------------------------
const searchBranchesFromPattern = async (searchPatternArg: string, projectPath: string) => {
  if (searchPatternArg) {
    const branchNames = await Promise.all([
      fetchProjectBranches({
        projectPath,
        searchPattern: searchPatternArg,
        offset: 0,
        limit: 1,
      }),
      fetchProjectBranches({
        projectPath,
        searchPattern: `*${searchPatternArg}*`,
        offset: 0,
        limit: 100,
      }),
    ]);

    return uniq(flatten(branchNames));
  }

  return fetchProjectBranches({
    projectPath,
    searchPattern: '*',
    offset: 0,
    limit: 100,
  });
};

export const searchBranches = async (
  searchPattern: string,
  defaultItems: BranchQuickPickItem[],
  projectPath: string,
) => {
  const branchNames = await searchBranchesFromPattern(searchPattern, projectPath);
  const branchItems = branchNames.map(mapBranchNameToQuickPickItem);

  const allItems: BranchQuickPickItem[] = [...defaultItems, ...branchItems];

  return allItems.length ? allItems : [ITEM_NOT_FOUND];
};

// region: branch creation functions -----------------------------------
const validateAndSubmitBranchName = async (
  branchName: string,
  { ref, isEmptyRepo, projectPath }: { ref: string; isEmptyRepo: boolean; projectPath: string },
) => {
  if (!branchName) {
    return 'Branch name cannot be empty.';
  }

  // If we are in an empty repo, just accept the branch name
  // why: Creating a branch will actually make the repo non-empty so we just
  //      support the user "checking out" a local branch name
  // TODO: Maybe we should do some client-side validation here
  if (isEmptyRepo) {
    return undefined;
  }

  const { errors } = await tryCreateProjectBranch({
    name: branchName,
    projectPath,
    ref,
  });

  if (errors?.length) {
    return errors[0];
  }

  return undefined;
};

interface ShowCreateBranchPromptOptions {
  project: GitLabProject;
  baseRef: string;
}

export const showCreateBranchPrompt = async (
  options: ShowCreateBranchPromptOptions,
): Promise<string | undefined> => {
  const { path_with_namespace: projectPath, empty_repo: isEmptyRepo } = options.project;
  const { baseRef } = options;

  const result = await showInputBox({
    placeholder: 'Branch name',
    prompt: 'Please provide a new branch name',
    onSubmit: branchName =>
      validateAndSubmitBranchName(branchName, { ref: baseRef, isEmptyRepo, projectPath }),
  });

  if (result.canceled) {
    return undefined;
  }

  return result.value;
};

export interface LoadRefOptions {
  projectPath: string;
  ref: string;
  pageReload: boolean;
  sourceControl: SourceControlSystem;
}

export const loadRef = async (options: LoadRefOptions) => {
  const hasChanges = (await options.sourceControl.status()).length;

  if (hasChanges) {
    await vscode.commands.executeCommand(RELOAD_WITH_WARNING_COMMAND_ID, {
      message: `Are you sure you want to checkout "${options.ref}"? Any unsaved changes will be lost.`,
      okText: 'Yes',
      ref: options.ref,
    });
    return;
  }

  await vscode.commands.executeCommand(RELOAD_COMMAND_ID, {
    ref: options.ref,
    projectPath: options.projectPath,
    pageReload: options.pageReload,
  });
};

export const getRefFromBranchSelection = async (
  selection: BranchQuickPickItem | undefined,
  options: CommandsInitialData,
): Promise<string | undefined> => {
  if (!selection) {
    return undefined;
  }

  if (selection.type === 'not-found') {
    return undefined;
  }
  if (selection.type === 'existing-branch' || selection.type === 'current') {
    return selection.ref;
  }

  if (selection.type === 'new-branch') {
    return showCreateBranchPrompt({
      project: options.project,
      baseRef: options.ref.sha,
    });
  }

  return undefined;
};
// region: main branch selection functions -----------------------------
export const selectBranch = async (
  options: CommandsInitialData,
  placeholder: string = 'Select a branch',
): Promise<string | undefined> => {
  const currentBranch = options.ref.type === 'branch' ? options.ref.branch.name : options.ref.sha;
  const projectPath = options.project.path_with_namespace;

  // Create default items based on configuration
  const defaultItems: BranchQuickPickItem[] = [];
  defaultItems.push(createCurrentBranchItem(currentBranch));

  const selection = await showSearchableQuickPick<BranchQuickPickItem>({
    placeholder,
    defaultItems,
    searchItems: searchPattern => searchBranches(searchPattern, defaultItems, projectPath),
    handleSearchError,
  });

  // Handle different selection types
  if (!selection) {
    return undefined;
  }

  if (selection.type === 'not-found') {
    return undefined;
  }

  return getRefFromBranchSelection(selection, options);
};
