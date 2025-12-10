import * as vscode from 'vscode';
import type { DefaultGitLabClient } from '@khulnasoft/khulnasoft-api-client';
import { gitlabApi } from '@khulnasoft/khulnasoft-api-client';
import { type SourceControlSystem } from '@khulnasoft/web-ide-fs';
import { createFakePartial } from '@khulnasoft/utils-test';
import deleteBranch from './deleteBranch';
import * as branchUtilities from './branchUtilities';
import { TEST_COMMANDS_INITIAL_DATA, TEST_BRANCH } from '../../test-utils';
import { createMockSourceControl } from '../../test-utils/createMockSourceControl';
import type { CommandsInitialData } from '../types';

const TEST_BRANCH_TO_DELETE = 'feature-to-delete';
const TEST_PROTECTED_BRANCH = 'protected-feature';
const TEST_DEFAULT_BRANCH = 'main';
const SELECT_BRANCH_PLACEHOLDER = 'Select a branch to delete';
const CONTINUE_BUTTON_TEXT = 'Permanently Delete';

jest.mock('./branchUtilities', () => ({
  ...jest.requireActual('./branchUtilities'),
  selectBranch: jest.fn(),
  loadRef: jest.fn(),
}));

describe('commands/deleteBranch', () => {
  let sourceControl: SourceControlSystem;
  let apiClient: DefaultGitLabClient;
  const mockSelectBranch = jest.mocked(branchUtilities.selectBranch);
  const mockLoadRef = jest.mocked(branchUtilities.loadRef);

  /**
   * Helper function to execute deleteBranch command with given options
   */
  const runDeleteBranchCommand = (options: CommandsInitialData) =>
    deleteBranch({
      asyncOptions: Promise.resolve(options),
      sourceControl,
      apiClient,
    })();

  beforeEach(() => {
    sourceControl = createMockSourceControl();
    apiClient = createFakePartial<DefaultGitLabClient>({
      fetchFromApi: jest.fn(),
    });
    jest.clearAllMocks();

    // Set default mock implementations
    mockSelectBranch.mockResolvedValue(undefined);
    mockLoadRef.mockResolvedValue(undefined);
    jest.mocked(apiClient.fetchFromApi).mockResolvedValue({});
  });

  it('shows error and prevents execution when user lacks pushCode permission', async () => {
    const optionsWithoutPush = {
      ...TEST_COMMANDS_INITIAL_DATA,
      userPermissions: {
        ...TEST_COMMANDS_INITIAL_DATA.userPermissions,
        pushCode: false,
      },
    };
    const expectedErrorMessage = 'You do not have permission to delete branches in this project.';

    await runDeleteBranchCommand(optionsWithoutPush);

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(expectedErrorMessage);
    expect(mockSelectBranch).not.toHaveBeenCalled();
    expect(apiClient.fetchFromApi).not.toHaveBeenCalled();
    expect(mockLoadRef).not.toHaveBeenCalled();
  });

  describe('when user has sufficient permissions', () => {
    describe('when user cancels branch selection', () => {
      beforeEach(async () => {
        mockSelectBranch.mockResolvedValue(undefined);
        await runDeleteBranchCommand(TEST_COMMANDS_INITIAL_DATA);
      });

      it('calls selectBranch with correct parameters', () => {
        expect(mockSelectBranch).toHaveBeenCalledWith(
          TEST_COMMANDS_INITIAL_DATA,
          SELECT_BRANCH_PLACEHOLDER,
        );
      });

      it('does not call API to check branch metadata', () => {
        expect(apiClient.fetchFromApi).not.toHaveBeenCalled();
      });
    });

    describe('when branch is selected', () => {
      beforeEach(() => {
        mockSelectBranch.mockResolvedValue(TEST_BRANCH_TO_DELETE);
      });

      describe('when selected branch is protected or default', () => {
        beforeEach(async () => {
          mockSelectBranch.mockResolvedValue(TEST_PROTECTED_BRANCH);
          jest.mocked(apiClient.fetchFromApi).mockResolvedValue({ protected: true });
          await runDeleteBranchCommand(TEST_COMMANDS_INITIAL_DATA);
        });

        it('calls API to check branch metadata', () => {
          expect(apiClient.fetchFromApi).toHaveBeenCalledWith(
            gitlabApi.getProjectBranch.createRequest({
              projectId: String(TEST_COMMANDS_INITIAL_DATA.project.id),
              branchName: TEST_PROTECTED_BRANCH,
            }),
          );
        });

        it('shows protected branch error message', () => {
          expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
            `You can't delete '${TEST_PROTECTED_BRANCH}' because it's protected.`,
          );
        });

        it('does not show confirmation dialog', () => {
          expect(vscode.window.showWarningMessage).not.toHaveBeenCalled();
        });

        it('does not call delete API', () => {
          expect(apiClient.fetchFromApi).toHaveBeenCalledTimes(1); // Only metadata check
        });
      });

      describe('when selected branch is not protected or default', () => {
        beforeEach(() => {
          jest.mocked(apiClient.fetchFromApi).mockResolvedValue({ protected: false });
        });

        describe('when user cancels confirmation', () => {
          beforeEach(async () => {
            jest.mocked(vscode.window.showWarningMessage).mockResolvedValue(undefined);
            await runDeleteBranchCommand(TEST_COMMANDS_INITIAL_DATA);
          });

          it('shows confirmation dialog', () => {
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
              `This action will permanently delete the '${TEST_BRANCH_TO_DELETE}' branch. Are you sure?`,
              {
                detail: 'The deleted branch may not belong to you, and can never be recovered.',
                modal: true,
              },
              CONTINUE_BUTTON_TEXT,
            );
          });

          it('does not call delete API', () => {
            expect(apiClient.fetchFromApi).toHaveBeenCalledTimes(1); // Only metadata check
          });

          it('does not show success message', () => {
            expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
          });
        });

        describe('when user confirms deletion', () => {
          beforeEach(async () => {
            jest
              .mocked(vscode.window.showWarningMessage)
              .mockResolvedValue(CONTINUE_BUTTON_TEXT as unknown as vscode.MessageItem);
            jest.mocked(apiClient.fetchFromApi).mockResolvedValueOnce({ protected: false }); // metadata check
            jest.mocked(apiClient.fetchFromApi).mockResolvedValueOnce({}); // deletion call
            await runDeleteBranchCommand(TEST_COMMANDS_INITIAL_DATA);
          });

          it('calls API to delete branch', () => {
            expect(apiClient.fetchFromApi).toHaveBeenCalledWith(
              gitlabApi.deleteProjectBranch.createRequest({
                projectId: String(TEST_COMMANDS_INITIAL_DATA.project.id),
                branchName: TEST_BRANCH_TO_DELETE,
              }),
            );
          });

          it('shows success message', () => {
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
              `Branch '${TEST_BRANCH_TO_DELETE}' deleted successfully.`,
            );
          });

          it('does not reload when deleting different branch', () => {
            expect(mockLoadRef).not.toHaveBeenCalled();
          });
        });
      });
    });
  });

  describe('edge cases and error scenarios', () => {
    it('handles selectBranch returning undefined (user cancellation)', async () => {
      mockSelectBranch.mockResolvedValue(undefined);

      await runDeleteBranchCommand(TEST_COMMANDS_INITIAL_DATA);

      expect(apiClient.fetchFromApi).not.toHaveBeenCalled();
      expect(vscode.window.showWarningMessage).not.toHaveBeenCalled();
      expect(mockLoadRef).not.toHaveBeenCalled();
    });

    it('handles API error when checking branch metadata', async () => {
      mockSelectBranch.mockResolvedValue(TEST_BRANCH_TO_DELETE);
      jest.mocked(apiClient.fetchFromApi).mockRejectedValue(new Error('API Error'));

      await expect(runDeleteBranchCommand(TEST_COMMANDS_INITIAL_DATA)).rejects.toThrow('API Error');

      expect(vscode.window.showWarningMessage).not.toHaveBeenCalled();
    });

    it('handles deleting current branch and loads default branch', async () => {
      const currentBranchOptions = {
        ...TEST_COMMANDS_INITIAL_DATA,
        ref: {
          type: 'branch' as const,
          branch: {
            ...TEST_BRANCH,
            name: TEST_BRANCH_TO_DELETE,
          },
          sha: TEST_BRANCH.commit.id,
        },
        project: {
          ...TEST_COMMANDS_INITIAL_DATA.project,
          default_branch: TEST_DEFAULT_BRANCH,
        },
      };

      mockSelectBranch.mockResolvedValue(TEST_BRANCH_TO_DELETE);
      jest
        .mocked(vscode.window.showWarningMessage)
        .mockResolvedValue(CONTINUE_BUTTON_TEXT as unknown as vscode.MessageItem);
      jest.mocked(apiClient.fetchFromApi).mockResolvedValueOnce({ protected: false });
      jest.mocked(apiClient.fetchFromApi).mockResolvedValueOnce({});

      await runDeleteBranchCommand(currentBranchOptions);

      expect(mockLoadRef).toHaveBeenCalledWith({
        projectPath: currentBranchOptions.project.path_with_namespace,
        ref: TEST_DEFAULT_BRANCH,
        pageReload: true,
        sourceControl,
      });
    });
  });
});
