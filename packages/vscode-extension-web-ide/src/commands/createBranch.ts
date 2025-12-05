import type { SourceControlSystem } from '@gitlab/web-ide-fs';
import * as vscode from 'vscode';
import type { CommandsInitialData } from '../types';
import { loadRef, selectBranch, showCreateBranchPrompt } from './branchUtilities';

const BRANCH_SELECTION_PLACEHOLDER = 'Select a branch to create a new branch from';

interface CreateAmendOptions {
  asyncOptions: Thenable<CommandsInitialData>;
  sourceControl: SourceControlSystem;
  showBaseBranchSelection: boolean;
}

export default ({
    asyncOptions,
    sourceControl,
    showBaseBranchSelection = true,
  }: CreateAmendOptions) =>
  async () => {
    const options = await asyncOptions;

    // Check if user has permission to create branches
    if (!options.userPermissions.pushCode) {
      await vscode.window.showErrorMessage(
        'You do not have permission to create branches in this project.',
      );
      return;
    }

    let baseRef: string = options.ref.sha;

    // Step 1: Select base branch only if showBaseBranchSelection is true
    if (showBaseBranchSelection) {
      const selectedBranch = await selectBranch(options, BRANCH_SELECTION_PLACEHOLDER);

      // User canceled base branch selection
      if (!selectedBranch) {
        return;
      }

      baseRef = selectedBranch;
    }

    // Step 3: Get the new branch name from user
    const branchName = await showCreateBranchPrompt({
      project: options.project,
      baseRef,
    });

    if (!branchName) {
      return;
    }

    await loadRef({
      projectPath: options.project.path_with_namespace,
      ref: branchName,
      pageReload: baseRef !== options.ref.sha,
      sourceControl,
    });
  };
