import { type SourceControlSystem } from '@gitlab/web-ide-fs';
import * as vscode from 'vscode';
import { TEST_COMMANDS_INITIAL_DATA } from '../../test-utils';
import { createMockSourceControl } from '../../test-utils/createMockSourceControl';
import type { CommandsInitialData } from '../types';
import * as branchUtilities from './branchUtilities';
import createBranch from './createBranch';

const TEST_BASE_BRANCH = 'feature-base';
const TEST_NEW_BRANCH_NAME = 'new-feature';
const TEST_BRANCH_SELECTION_PLACEHOLDER = 'Select a branch to create a new branch from';

jest.mock('./branchUtilities', () => ({
  ...jest.requireActual('./branchUtilities'),
  selectBranch: jest.fn(),
  showCreateBranchPrompt: jest.fn(),
  loadRef: jest.fn(),
}));

describe('commands/createBranch', () => {
  let sourceControl: SourceControlSystem;
  const mockSelectBranch = jest.mocked(branchUtilities.selectBranch);
  const mockShowCreateBranchPrompt = jest.mocked(branchUtilities.showCreateBranchPrompt);
  const mockLoadRef = jest.mocked(branchUtilities.loadRef);

  /**
   * Helper function to execute createBranch command with given options
   */
  const runCreateBranchCommand = (options: CommandsInitialData, showBaseBranchSelection: boolean) =>
    createBranch({
      asyncOptions: Promise.resolve(options),
      sourceControl,
      showBaseBranchSelection,
    })();

  beforeEach(() => {
    sourceControl = createMockSourceControl();
    jest.clearAllMocks();

    // Set default mock implementations
    mockSelectBranch.mockResolvedValue(undefined);
    mockShowCreateBranchPrompt.mockResolvedValue(undefined);
    mockLoadRef.mockResolvedValue(undefined);
  });

  it('shows error and prevents execution when user lacks pushCode permission', async () => {
    const optionsWithoutPush = {
      ...TEST_COMMANDS_INITIAL_DATA,
      userPermissions: {
        ...TEST_COMMANDS_INITIAL_DATA.userPermissions,
        pushCode: false,
      },
    };
    const expectedErrorMessage = 'You do not have permission to create branches in this project.';

    await runCreateBranchCommand(optionsWithoutPush, true);

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(expectedErrorMessage);
    expect(mockSelectBranch).not.toHaveBeenCalled();
    expect(mockShowCreateBranchPrompt).not.toHaveBeenCalled();
    expect(mockLoadRef).not.toHaveBeenCalled();
  });

  describe('when user has sufficient permissions', () => {
    describe('with base branch selection enabled', () => {
      beforeEach(async () => {
        await runCreateBranchCommand(TEST_COMMANDS_INITIAL_DATA, true);
        mockSelectBranch.mockResolvedValue(undefined);
      });
      describe('when base branch selection is cancelled', () => {
        it('calls selectBranch with correct parameters', () => {
          expect(mockSelectBranch).toHaveBeenCalledWith(
            TEST_COMMANDS_INITIAL_DATA,
            TEST_BRANCH_SELECTION_PLACEHOLDER,
          );
        });

        it('does not call showCreateBranchPrompt', () => {
          expect(mockShowCreateBranchPrompt).not.toHaveBeenCalled();
        });
      });

      describe('when base branch is selected', () => {
        beforeEach(async () => {
          mockSelectBranch.mockResolvedValue(TEST_BASE_BRANCH);
          mockShowCreateBranchPrompt.mockResolvedValue(TEST_NEW_BRANCH_NAME);
          await runCreateBranchCommand(TEST_COMMANDS_INITIAL_DATA, true);
        });

        it('calls showCreateBranchPrompt with updated base ref', () => {
          expect(mockShowCreateBranchPrompt).toHaveBeenCalledWith({
            project: TEST_COMMANDS_INITIAL_DATA.project,
            baseRef: TEST_BASE_BRANCH,
          });
        });

        describe('pageReload behavior', () => {
          it('reloads when base branch differs from current', async () => {
            mockSelectBranch.mockResolvedValue('different-branch');
            mockShowCreateBranchPrompt.mockResolvedValue(TEST_NEW_BRANCH_NAME);

            await runCreateBranchCommand(TEST_COMMANDS_INITIAL_DATA, true);

            expect(mockLoadRef).toHaveBeenCalledWith({
              projectPath: TEST_COMMANDS_INITIAL_DATA.project.path_with_namespace,
              ref: TEST_NEW_BRANCH_NAME,
              pageReload: true,
              sourceControl,
            });
          });

          it('does not reload when base branch is current', async () => {
            mockSelectBranch.mockResolvedValue(TEST_COMMANDS_INITIAL_DATA.ref.sha);
            mockShowCreateBranchPrompt.mockResolvedValue(TEST_NEW_BRANCH_NAME);

            await runCreateBranchCommand(TEST_COMMANDS_INITIAL_DATA, true);

            expect(mockLoadRef).toHaveBeenCalledWith({
              projectPath: TEST_COMMANDS_INITIAL_DATA.project.path_with_namespace,
              ref: TEST_NEW_BRANCH_NAME,
              pageReload: false,
              sourceControl,
            });
          });
        });
      });
    });

    describe('with base branch selection disabled', () => {
      beforeEach(async () => {
        mockShowCreateBranchPrompt.mockResolvedValue(TEST_NEW_BRANCH_NAME);
        await runCreateBranchCommand(TEST_COMMANDS_INITIAL_DATA, false);
      });
      it('does not call selectBranch', async () => {
        expect(mockSelectBranch).not.toHaveBeenCalled();
      });

      it('calls showCreateBranchPrompt with original base ref', () => {
        expect(mockShowCreateBranchPrompt).toHaveBeenCalledWith({
          project: TEST_COMMANDS_INITIAL_DATA.project,
          baseRef: TEST_COMMANDS_INITIAL_DATA.ref.sha,
        });
      });

      it('does not reload when calling loadRef', () => {
        expect(mockLoadRef).toHaveBeenCalledWith({
          projectPath: TEST_COMMANDS_INITIAL_DATA.project.path_with_namespace,
          ref: TEST_NEW_BRANCH_NAME,
          pageReload: false,
          sourceControl,
        });
      });
    });
  });

  describe('edge cases', () => {
    it('handles showCreateBranchPrompt cancellation', async () => {
      mockShowCreateBranchPrompt.mockResolvedValue(undefined);

      await runCreateBranchCommand(TEST_COMMANDS_INITIAL_DATA, false);

      expect(mockLoadRef).not.toHaveBeenCalled();
    });

    it('handles selectBranch cancellation when base selection enabled', async () => {
      mockSelectBranch.mockResolvedValue(undefined);

      await runCreateBranchCommand(TEST_COMMANDS_INITIAL_DATA, true);

      expect(mockShowCreateBranchPrompt).not.toHaveBeenCalled();
      expect(mockLoadRef).not.toHaveBeenCalled();
    });
  });
});
