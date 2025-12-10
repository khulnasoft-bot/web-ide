import { type DefaultGitLabClient, gitlabApi } from '@khulnasoft/khulnasoft-api-client';
import type { SourceControlSystem } from '@khulnasoft/web-ide-fs';
import * as vscode from 'vscode';
import type { CommandsInitialData } from '../types';
import { loadRef, selectBranch } from './branchUtilities';

const SELECT_BRANCH_PLACEHOLDER = 'Select a branch to delete';
interface DeleteBranchCommandOptions {
  asyncOptions: Thenable<CommandsInitialData>;
  sourceControl: SourceControlSystem;
  apiClient: DefaultGitLabClient;
}

// region: command factory and handler ---------------------------------
export default ({ asyncOptions, sourceControl, apiClient }: DeleteBranchCommandOptions) =>
  async () => {
    const options = await asyncOptions;
    // Check if user has permission to delete branches
    if (!options.userPermissions.pushCode) {
      await vscode.window.showErrorMessage(
        'You do not have permission to delete branches in this project.',
      );
      return;
    }

    const baseBranch = await selectBranch(options, SELECT_BRANCH_PLACEHOLDER);
    // User cancelled base branch selection
    if (!baseBranch) {
      return;
    }

    // Step 2: Check if the selected branch is protected
    const branchMetadata = await apiClient.fetchFromApi(
      gitlabApi.getProjectBranch.createRequest({
        projectId: String(options.project.id),
        branchName: baseBranch,
      }),
    );
    if (branchMetadata.protected) {
      await vscode.window.showErrorMessage(
        `You can't delete '${baseBranch}' because it's protected.`,
      );
      return;
    }

    // Step 3: Show warning message about branch deletion
    const answer = await vscode.window.showWarningMessage(
      `This action will permanently delete the '${baseBranch}' branch. Are you sure?`,
      {
        modal: true,
        detail: 'The deleted branch may not belong to you, and can never be recovered.',
      },
      'Permanently Delete',
    );
    if (answer !== 'Permanently Delete') {
      return;
    }

    // Step 4: Delete the branch
    try {
      await apiClient.fetchFromApi(
        gitlabApi.deleteProjectBranch.createRequest({
          projectId: String(options.project.id),
          branchName: baseBranch,
        }),
      );
      vscode.window.showInformationMessage(`Branch '${baseBranch}' deleted successfully.`);

      const currentBranch =
        options.ref.type === 'branch' ? options.ref.branch.name : options.ref.sha;
      let branchToLoad = currentBranch;
      if (currentBranch === baseBranch) {
        branchToLoad = options.project.default_branch;
        await loadRef({
          projectPath: options.project.path_with_namespace,
          ref: branchToLoad,
          pageReload: true,
          sourceControl,
        });
      }
    } catch {
      vscode.window.showErrorMessage(`Failed to delete branch '${baseBranch}'.`);
    }
  };
