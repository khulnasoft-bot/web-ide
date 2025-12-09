import * as vscode from 'vscode';
import type { FileStatus } from '@khulnasoft/web-ide-fs';
import { FileStatusType } from '@khulnasoft/web-ide-fs';
import { type DefaultGitLabClient, NOOP_AUTH_PROVIDER } from '@gitlab/gitlab-api-client';
import { createFakePartial } from '@khulnasoft/utils-test';
import type { GitLabCommitPayload } from '@khulnasoft/vscode-mediator-commands';
import type { CommitCommand, ReadonlySourceControlViewModel } from '../types';
import type { LocalStorage } from '../../types';
import { generateCommitMessage } from './generateCommitMessage';
import { getBranchSelection } from './getBranchSelection';
import { factory } from './command';
import { getCommitPayload } from './getCommitPayload';
import { RELOAD_COMMAND_ID } from '../../constants';
import { TEST_PROJECT, TEST_REF_BRANCH } from '../../../test-utils';
import { createFakeGlobalState } from '../../../test-utils/vscode';
import { showSuccessMessage } from './showSuccessMessage';
import { showCommitErrorMessage } from './showCommitErrorMessage';
import DefaultLocalStorage from '../../DefaultLocalStorage';
import { setupFakeMediatorToken } from '../../../test-utils/setupFakeMediatorToken';
import { setupMediatorCommandExecutor } from '../../mediator';
import { getAmendCommitPayload } from './getAmendCommitPayload';
import { showConfirmForcePush } from './showConfirmForcePush';
import { getRemoteCommitDifference } from './getRemoteCommitDifference';

jest.mock('./getBranchSelection');
jest.mock('./generateCommitMessage');
jest.mock('./showSuccessMessage');
jest.mock('./showCommitErrorMessage');
jest.mock('./getAmendCommitPayload');
jest.mock('./showConfirmForcePush');
jest.mock('./getRemoteCommitDifference');

const TEST_COMMIT_MESSAGE = 'Hello world! Test commit!';
const TEST_GENERATED_COMMIT_MESSAGE = 'Genearted commit message:\n\n123';
const TEST_BRANCH_MR_URL = 'https://gitlab.example.com/mr/1';
const TEST_BRANCH_SELECTION = {
  branchName: 'foo-branch-patch-123',
  isNewBranch: false,
};
const TEST_COMMIT_ID = '000000111111';
const TEST_STATUS: FileStatus[] = [{ type: FileStatusType.Deleted, path: '/README.md' }];
const TEST_MEDIATOR_TOKEN = 'fake-mediator-token';

describe('scm/commit/command', () => {
  let viewModel: jest.MockedObject<ReadonlySourceControlViewModel>;
  let command: CommitCommand;
  let localStorage: LocalStorage;
  let apiClient: DefaultGitLabClient;

  beforeEach(async () => {
    localStorage = new DefaultLocalStorage(createFakeGlobalState());
    viewModel = {
      getCommitMessage: jest.fn().mockReturnValue(TEST_COMMIT_MESSAGE),
      getStatus: jest.fn().mockReturnValue(TEST_STATUS),
    };
    apiClient = createFakePartial<DefaultGitLabClient>({
      fetchFromApi: jest.fn().mockImplementation(async request => {
        if (request.path?.includes('/commit')) {
          return { id: TEST_COMMIT_ID };
        }
        return undefined;
      }),
      fetchBufferFromApi: jest.fn().mockResolvedValue(Buffer.from('test content')),
    });

    jest.mocked(getBranchSelection).mockResolvedValueOnce(TEST_BRANCH_SELECTION);
    jest.mocked(generateCommitMessage).mockReturnValue(TEST_GENERATED_COMMIT_MESSAGE);
    jest.mocked(getRemoteCommitDifference).mockResolvedValue(0);

    setupFakeMediatorToken(TEST_MEDIATOR_TOKEN);
    await setupMediatorCommandExecutor(NOOP_AUTH_PROVIDER);
  });

  describe('with default dependencies', () => {
    beforeEach(() => {
      jest.mocked(showConfirmForcePush).mockResolvedValueOnce(true);
      command = factory({
        project: TEST_PROJECT,
        ref: TEST_REF_BRANCH,
        branchMergeRequestUrl: TEST_BRANCH_MR_URL,
        viewModel,
        localStorage,
        force: false,
        amend: false,
        apiClient,
      });
    });

    describe('default', () => {
      beforeEach(async () => {
        await command();
      });
      it('calls commit API', () => {
        expect(apiClient.fetchFromApi).toHaveBeenCalledWith(
          expect.objectContaining({
            path: expect.stringContaining('projects/7/repository/commits'),
            type: 'rest',
            method: 'POST',
            body: getCommitPayload({
              status: TEST_STATUS,
              commitMessage: TEST_COMMIT_MESSAGE,
              startingSha: TEST_REF_BRANCH.sha,
              branchName: TEST_BRANCH_SELECTION.branchName,
              isNewBranch: false,
              force: false,
            }),
          }),
        );
      });

      it('shows success message', () => {
        expect(showSuccessMessage).toHaveBeenCalledWith({
          project: TEST_PROJECT,
          ref: TEST_REF_BRANCH,
          commitBranchName: TEST_BRANCH_SELECTION.branchName,
          mrUrl: TEST_BRANCH_MR_URL,
          force: false,
          amend: false,
        });
      });

      it('calls reload command', () => {
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(RELOAD_COMMAND_ID, {
          ref: TEST_BRANCH_SELECTION.branchName,
        });
      });

      it('calls getBranchSelection', () => {
        expect(getBranchSelection).toHaveBeenCalledTimes(1);
        expect(getBranchSelection).toHaveBeenCalledWith({
          project: TEST_PROJECT,
          ref: TEST_REF_BRANCH,
          localStorage,
          shouldPromptBranchName: false,
        });
      });
    });

    describe('when branch selection is undefined', () => {
      beforeEach(async () => {
        jest.mocked(getBranchSelection).mockReset().mockResolvedValueOnce(undefined);
        await command();
      });

      it('does not call API to create commit', () => {
        expect(apiClient.fetchFromApi).not.toHaveBeenCalled();
      });
    });

    describe('with new branch selection', () => {
      beforeEach(async () => {
        jest
          .mocked(getBranchSelection)
          .mockReset()
          .mockResolvedValueOnce({ ...TEST_BRANCH_SELECTION, isNewBranch: true });
        await command();
      });

      it('does not include branch MR URL in showSuccessMessage', () => {
        expect(showSuccessMessage).toHaveBeenCalledWith({
          project: TEST_PROJECT,
          commitBranchName: TEST_BRANCH_SELECTION.branchName,
          ref: TEST_REF_BRANCH,
          mrUrl: '',
          force: false,
          amend: false,
        });
      });
    });

    describe('when commit fails', () => {
      const testError = new Error();

      beforeEach(async () => {
        jest.spyOn(console, 'error').mockImplementation();
        (apiClient.fetchFromApi as jest.Mock).mockRejectedValue(testError);
        await command();
      });

      it('logs and shows error message', () => {
        // eslint-disable-next-line no-console
        expect(console.error).toHaveBeenCalledWith(testError);
        expect(showCommitErrorMessage).toHaveBeenCalledWith(testError);
      });

      it('does not call reload command', () => {
        expect(vscode.commands.executeCommand).not.toHaveBeenCalledWith(
          RELOAD_COMMAND_ID,
          expect.anything(),
        );
      });

      it('does not show success message', () => {
        expect(showSuccessMessage).not.toHaveBeenCalled();
      });
    });

    describe('when viewModel.getCommitMessage is empty', () => {
      beforeEach(async () => {
        viewModel.getCommitMessage.mockReturnValue('');
        await command();
      });

      it('generates commit message for payload', () => {
        expect(generateCommitMessage).toHaveBeenCalledWith(TEST_STATUS);
        expect(apiClient.fetchFromApi).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.objectContaining({
              commit_message: TEST_GENERATED_COMMIT_MESSAGE,
            }),
          }),
        );
      });
    });

    describe('with empty status', () => {
      beforeEach(async () => {
        viewModel.getStatus.mockReturnValue([]);
        await command();
      });

      it('shows information message', () => {
        expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
          expect.stringMatching('No changes found'),
        );
      });

      it('does not execute any other commands', () => {
        expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
      });
    });

    describe('with shouldPromptBranchName options', () => {
      beforeEach(async () => {
        await command({ shouldPromptBranchName: true });
      });

      it('calls getBranchSelection with shouldPromptBranchName: true', () => {
        expect(getBranchSelection).toHaveBeenCalledTimes(1);
        expect(getBranchSelection).toHaveBeenCalledWith(
          expect.objectContaining({
            shouldPromptBranchName: true,
          }),
        );
      });
    });

    describe('with null options', () => {
      beforeEach(async () => {
        await command(null);
      });

      it('calls getBranchSelection with shouldPromptBranchName: false', () => {
        expect(getBranchSelection).toHaveBeenCalledTimes(1);
        expect(getBranchSelection).toHaveBeenCalledWith(
          expect.objectContaining({
            shouldPromptBranchName: false,
          }),
        );
      });
    });
  });

  describe('with force option enabled', () => {
    beforeEach(() => {
      command = factory({
        project: TEST_PROJECT,
        ref: TEST_REF_BRANCH,
        branchMergeRequestUrl: TEST_BRANCH_MR_URL,
        viewModel,
        localStorage,
        force: true,
        apiClient,
      });

      jest.mocked(getRemoteCommitDifference).mockResolvedValue(3);
    });

    it('shows warning message before committing and provides commit difference', async () => {
      await command();

      expect(getRemoteCommitDifference).toHaveBeenCalledWith(
        apiClient,
        TEST_PROJECT.id.toString(),
        TEST_REF_BRANCH,
      );

      expect(showConfirmForcePush).toHaveBeenCalledWith({
        force: true,
        amend: false,
        existingCommits: 3,
      });
    });

    describe('when obtaining the commit difference fails', () => {
      beforeEach(() => {
        jest.mocked(getRemoteCommitDifference).mockRejectedValue(new Error());
      });

      it('shows warning message before committing and provides commit difference of 1', async () => {
        await command();

        expect(showConfirmForcePush).toHaveBeenCalledWith({
          force: true,
          amend: false,
          existingCommits: 1,
        });
      });
    });

    describe('when user confirms force commit', () => {
      beforeEach(async () => {
        jest.mocked(showConfirmForcePush).mockResolvedValueOnce(true);
        await command();
      });

      it('calls commit API with force option', () => {
        expect(apiClient.fetchFromApi).toHaveBeenCalledWith(
          expect.objectContaining({
            path: expect.stringContaining('projects/7/repository/commits'),
            type: 'rest',
            method: 'POST',
            body: getCommitPayload({
              status: TEST_STATUS,
              commitMessage: TEST_COMMIT_MESSAGE,
              startingSha: TEST_REF_BRANCH.sha,
              branchName: TEST_BRANCH_SELECTION.branchName,
              isNewBranch: false,
              force: true,
            }),
          }),
        );
      });

      it('shows success message with force option', () => {
        expect(showSuccessMessage).toHaveBeenCalledWith({
          project: TEST_PROJECT,
          ref: TEST_REF_BRANCH,
          commitBranchName: TEST_BRANCH_SELECTION.branchName,
          mrUrl: TEST_BRANCH_MR_URL,
          force: true,
          amend: false,
        });
      });

      it('calls reload command', () => {
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(RELOAD_COMMAND_ID, {
          ref: TEST_BRANCH_SELECTION.branchName,
        });
      });
    });

    describe('when user declines force commit', () => {
      beforeEach(async () => {
        jest.mocked(showConfirmForcePush).mockResolvedValueOnce(false);
        await command();
      });

      it('calls getRemoteCommitDifference before showing confirmation', () => {
        expect(getRemoteCommitDifference).toHaveBeenCalledTimes(1);
        expect(getRemoteCommitDifference).toHaveBeenCalledWith(
          apiClient,
          String(TEST_PROJECT.id),
          TEST_REF_BRANCH,
        );
      });

      it('does not call commit API', () => {
        expect(apiClient.fetchFromApi).not.toHaveBeenCalled();
      });

      it('does not call showSuccessMessage', () => {
        expect(showSuccessMessage).not.toHaveBeenCalled();
      });
    });
  });
  describe('with amend option enabled', () => {
    beforeEach(() => {
      command = factory({
        project: TEST_PROJECT,
        ref: TEST_REF_BRANCH,
        branchMergeRequestUrl: TEST_BRANCH_MR_URL,
        viewModel,
        localStorage,
        amend: true,
        force: true,
        apiClient,
      });
    });

    describe('when user confirms amend', () => {
      const amendCommitPayload = createFakePartial<GitLabCommitPayload>({});
      beforeEach(async () => {
        jest.mocked(showConfirmForcePush).mockResolvedValueOnce(true);
        jest.mocked(getAmendCommitPayload).mockResolvedValueOnce(amendCommitPayload);

        await command();
      });

      it('shows warning message before amending', () => {
        expect(showConfirmForcePush).toHaveBeenCalledWith({
          force: true,
          amend: true,
          existingCommits: 0,
        });
      });

      it('calls getAmendCommitPayload with correct parameters', () => {
        expect(getAmendCommitPayload).toHaveBeenCalledWith(apiClient, {
          projectId: String(TEST_PROJECT.id),
          startingSha: TEST_REF_BRANCH.sha,
          status: TEST_STATUS,
          commitMessage: TEST_COMMIT_MESSAGE,
          branchName: TEST_BRANCH_SELECTION.branchName,
          isNewBranch: false,
        });
      });

      it('calls commit API with force option', () => {
        expect(apiClient.fetchFromApi).toHaveBeenCalledWith({
          path: expect.stringContaining('projects/7/repository/commits'),
          type: 'rest',
          method: 'POST',
          body: amendCommitPayload,
        });
      });

      it('shows success message with amend option', () => {
        expect(showSuccessMessage).toHaveBeenCalledWith({
          project: TEST_PROJECT,
          ref: TEST_REF_BRANCH,
          commitBranchName: TEST_BRANCH_SELECTION.branchName,
          mrUrl: TEST_BRANCH_MR_URL,
          force: true,
          amend: true,
        });
      });

      it('calls reload command', () => {
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(RELOAD_COMMAND_ID, {
          ref: TEST_BRANCH_SELECTION.branchName,
        });
      });
    });
    describe('when user declines amend', () => {
      beforeEach(async () => {
        jest.mocked(showConfirmForcePush).mockResolvedValueOnce(false);
        await command();
      });

      it('calls getRemoteCommitDifference before showing confirmation', () => {
        expect(getRemoteCommitDifference).toHaveBeenCalledTimes(1);
        expect(getRemoteCommitDifference).toHaveBeenCalledWith(
          apiClient,
          String(TEST_PROJECT.id),
          TEST_REF_BRANCH,
        );
      });

      it('does not call commit API', () => {
        expect(apiClient.fetchFromApi).not.toHaveBeenCalled();
      });

      it('does not call showSuccessMessage', () => {
        expect(showSuccessMessage).not.toHaveBeenCalled();
      });
    });
  });
});
