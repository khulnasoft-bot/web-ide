import * as vscode from 'vscode';
import type { GitLabRef, GitLabProject } from '@khulnasoft/vscode-mediator-commands';
import type { DefaultGitLabClient } from '@gitlab/gitlab-api-client';
import { gitlabApi } from '@gitlab/gitlab-api-client';
import { defaultLogger } from '@gitlab/logger';
import { RELOAD_COMMAND_ID } from '../../constants';
import { generateCommitMessage } from './generateCommitMessage';
import { getCommitPayload } from './getCommitPayload';
import { showSuccessMessage } from './showSuccessMessage';
import { showCommitErrorMessage } from './showCommitErrorMessage';
import type { CommitCommand, ReadonlySourceControlViewModel } from '../types';
import type { LocalStorage } from '../../types';
import { getBranchSelection } from './getBranchSelection';
import { getAmendCommitPayload } from './getAmendCommitPayload';
import { showConfirmForcePush } from './showConfirmForcePush';
import { getRemoteCommitDifference } from './getRemoteCommitDifference';

interface CommandFactoryOptions {
  readonly ref: GitLabRef;
  readonly localStorage: LocalStorage;
  readonly branchMergeRequestUrl: string;
  readonly viewModel: ReadonlySourceControlViewModel;
  readonly project: GitLabProject;
  readonly apiClient: DefaultGitLabClient;
  force?: boolean;
  amend?: boolean;
}

/**
 * Factory for the "commit" command
 *
 * It's important th command itself doesn't take any arguments so that
 * it can be triggered by the user.
 */

export const factory =
  ({
    ref,
    branchMergeRequestUrl,
    viewModel,
    project,
    localStorage,
    apiClient,
    force = false,
    amend = false,
  }: CommandFactoryOptions): CommitCommand =>
  async commandOptions => {
    const { shouldPromptBranchName = false } = commandOptions || {};
    const status = viewModel.getStatus();
    // Assure there is change
    const messageChanged = Boolean(viewModel.getCommitMessage());
    const filesChanged = status.length > 0;
    const changeExists = amend ? messageChanged || filesChanged : filesChanged;

    if (!changeExists) {
      await vscode.window.showInformationMessage('No changes found. Not able to commit.');
      return;
    }

    // Show a warning before force committing
    let difference = 0;

    try {
      if (force || amend) {
        difference = await getRemoteCommitDifference(apiClient, String(project.id), ref);
      }
    } catch (e) {
      defaultLogger.error('Unable to fetch remote commit difference.', e);
      difference = 1;
    }

    if (!(await showConfirmForcePush({ force, amend, existingCommits: difference }))) {
      return;
    }

    const branchSelection = await getBranchSelection({
      project,
      ref,
      shouldPromptBranchName,
      localStorage,
    });

    const commitMessage = viewModel.getCommitMessage() || generateCommitMessage(status);

    // User canceled the operation
    if (!branchSelection) {
      return;
    }

    const { branchName, isNewBranch } = branchSelection;

    try {
      const commitPayload = amend
        ? await getAmendCommitPayload(apiClient, {
            status,
            projectId: String(project.id),
            commitMessage: viewModel.getCommitMessage(),
            branchName,
            isNewBranch,
            startingSha: ref.sha,
          })
        : getCommitPayload({
            status,
            commitMessage,
            branchName,
            isNewBranch,
            startingSha: ref.sha,
            force,
          });

      await apiClient.fetchFromApi(
        gitlabApi.postProjectCommit.createRequest({ projectId: String(project.id) }, commitPayload),
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      await showCommitErrorMessage(e);
      return;
    }

    // If we created from a new branch, don't use the MR URL
    const mrUrl = isNewBranch ? '' : branchMergeRequestUrl;

    // We just want to fire and forget here

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    showSuccessMessage({
      project,
      ref,
      commitBranchName: branchName,
      mrUrl,
      force,
      amend,
    });

    await vscode.commands.executeCommand(RELOAD_COMMAND_ID, { ref: branchName });
  };
