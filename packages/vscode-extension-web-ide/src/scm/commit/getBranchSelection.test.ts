import * as vscode from 'vscode';
import { TEST_PROJECT, TEST_BRANCH, asRef, TEST_REF_COMMIT } from '../../../test-utils';
import { createFakeGlobalState } from '../../../test-utils/vscode';
import type { LocalStorage } from '../../types';
import { COMMIT_TO_DEFAULT_BRANCH_PREFERENCE } from '../../constants';
import DefaultLocalStorage from '../../DefaultLocalStorage';
import { promptBranchName } from './promptBranchName';
import type { BranchSelection } from './getBranchSelection';
import {
  getBranchSelection,
  CREATE_NEW_BRANCH_OPTION,
  CONTINUE_OPTION,
} from './getBranchSelection';

jest.mock('./promptBranchName');

describe('scm/commit/getBranchSelection', () => {
  const TEST_BRANCH_SELECTION = {
    branchName: 'foo-branch-patch-123',
    isNewBranch: false,
  };
  const DEFAULT_BRANCH = { ...TEST_BRANCH, default: true };
  const CANNOT_PUSH_BRANCH = { ...TEST_BRANCH, can_push: false };
  let localStorage: LocalStorage;
  const getBranchSelectionWithShouldPromptBranchName = () =>
    getBranchSelection({
      ref: asRef(TEST_BRANCH),
      project: TEST_PROJECT,
      localStorage,
      shouldPromptBranchName: true,
    });
  const getBranchSelectionWithDefaultBranch = () =>
    getBranchSelection({
      project: TEST_PROJECT,
      ref: asRef(DEFAULT_BRANCH),
      localStorage,
    });
  const getBranchSelectionWithCannotPushBranch = () =>
    getBranchSelection({
      project: TEST_PROJECT,
      ref: asRef(CANNOT_PUSH_BRANCH),
      localStorage,
    });
  const getBranchSelectionWithCommitRef = () =>
    getBranchSelection({
      ref: TEST_REF_COMMIT,
      project: TEST_PROJECT,
      localStorage,
    });

  beforeEach(() => {
    localStorage = new DefaultLocalStorage(createFakeGlobalState());

    jest.mocked(promptBranchName).mockResolvedValue(TEST_BRANCH_SELECTION);
  });

  describe('with empty project', () => {
    let branchSelection: BranchSelection;

    beforeEach(async () => {
      branchSelection = await getBranchSelection({
        project: { ...TEST_PROJECT, empty_repo: true },
        ref: asRef(TEST_BRANCH),
        localStorage,
      });
    });

    it('does not prompt for branch name', () => {
      expect(promptBranchName).not.toHaveBeenCalled();
    });

    it('returns { isNewBranch: false, branchName: TEST_BRANCH.name }', () => {
      expect(branchSelection).toEqual({
        isNewBranch: false,
        branchName: TEST_BRANCH.name,
      });
    });

    describe('when shouldPromptBranchName is true', () => {
      it('displays the prompt branch name input', async () => {
        const promptBranchResponse = { branchName: 'custom branch', isNewBranch: true };

        jest.mocked(promptBranchName).mockResolvedValue(promptBranchResponse);

        branchSelection = await getBranchSelection({
          project: { ...TEST_PROJECT, empty_repo: true },
          ref: asRef(TEST_BRANCH),
          localStorage,
          shouldPromptBranchName: true,
        });

        expect(branchSelection).toEqual(promptBranchResponse);
      });
    });
  });

  describe('when the user should enter a branch name', () => {
    it('displays the prompt branch name input', async () => {
      await getBranchSelectionWithShouldPromptBranchName();

      expect(promptBranchName).toHaveBeenCalledWith(TEST_BRANCH.name);
    });
  });

  describe('when the ref is not a branch', () => {
    it('displays the prompt branch name input', async () => {
      await getBranchSelectionWithCommitRef();

      expect(promptBranchName).toHaveBeenCalledWith('00110011');
    });
  });

  describe('when prompting for a branch name', () => {
    describe('with no branch selection', () => {
      beforeEach(() => {
        jest.mocked(promptBranchName).mockResolvedValue(undefined);
      });

      it('returns undefined', async () => {
        expect(await getBranchSelectionWithShouldPromptBranchName()).toBe(undefined);
      });
    });

    describe('with newBranch selection', () => {
      beforeEach(async () => {
        jest.mocked(promptBranchName).mockResolvedValue({
          ...TEST_BRANCH_SELECTION,
          isNewBranch: true,
        });
      });

      it('returns the branch name entered by the user', async () => {
        expect(await getBranchSelectionWithShouldPromptBranchName()).toEqual({
          branchName: TEST_BRANCH_SELECTION.branchName,
          isNewBranch: true,
        });
      });
    });
  });

  describe('when user cannot push to the current branch', () => {
    it('displays error message', async () => {
      await getBranchSelectionWithCannotPushBranch();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        `You can't push to the ${CANNOT_PUSH_BRANCH.name} branch. Do you want to commit your changes to a new branch?`,
        { modal: true },
        CREATE_NEW_BRANCH_OPTION,
      );
    });

    describe('when the user chooses to create a new branch', () => {
      it.each`
        promptResponse              | expectation
        ${CREATE_NEW_BRANCH_OPTION} | ${() => expect(promptBranchName).toHaveBeenCalledWith(CANNOT_PUSH_BRANCH.name)}
        ${undefined}                | ${() => expect(promptBranchName).not.toHaveBeenCalled()}
      `('prompts the user for a new branch name', async ({ promptResponse, expectation }) => {
        jest.mocked(vscode.window.showErrorMessage).mockResolvedValueOnce(promptResponse);

        await getBranchSelectionWithCannotPushBranch();

        expectation();
      });
    });
  });

  describe('when user is pushing to the default branch', () => {
    describe('when the IDE does not have a stored preference of pushing to default branch', () => {
      const pushToDefaultPreferenceKey = `${COMMIT_TO_DEFAULT_BRANCH_PREFERENCE}.${TEST_PROJECT.id}`;

      beforeEach(async () => {
        await localStorage.update(pushToDefaultPreferenceKey, false);
      });

      it('displays a warning message with options to continue or create new branch', async () => {
        await getBranchSelectionWithDefaultBranch();

        expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
          `You're committing your changes to the default branch. Do you want to continue?`,
          { modal: true },
          CONTINUE_OPTION,
          CREATE_NEW_BRANCH_OPTION,
        );
      });

      describe('when the user chooses continue option', () => {
        let branchSelection: BranchSelection;

        beforeEach(async () => {
          jest
            .mocked(vscode.window.showWarningMessage)
            .mockResolvedValueOnce(CONTINUE_OPTION as unknown as vscode.MessageItem);

          branchSelection = await getBranchSelectionWithDefaultBranch();
        });

        it('returns default branch as branch selection', () => {
          expect(branchSelection).toEqual({
            branchName: DEFAULT_BRANCH.name,
            isNewBranch: false,
          });
        });

        it('stores preference of pushing to the default branch', async () => {
          expect(localStorage.get(pushToDefaultPreferenceKey)).toBe(true);
        });
      });

      describe('when the user chooses create new branch option', () => {
        beforeEach(async () => {
          jest
            .mocked(vscode.window.showWarningMessage)
            .mockResolvedValueOnce(CREATE_NEW_BRANCH_OPTION as unknown as vscode.MessageItem);

          await getBranchSelectionWithDefaultBranch();
        });

        it('prompts the user to enter a new branch name', () => {
          expect(promptBranchName).toHaveBeenCalledWith(DEFAULT_BRANCH.name);
        });
      });
    });

    describe('when the IDE has a stored preference of pushing to default branch', () => {
      beforeEach(async () => {
        await localStorage.update(
          `${COMMIT_TO_DEFAULT_BRANCH_PREFERENCE}.${TEST_PROJECT.id}`,
          true,
        );
      });

      it('returns default branch as branch selection', async () => {
        expect(await getBranchSelectionWithDefaultBranch()).toEqual({
          isNewBranch: false,
          branchName: DEFAULT_BRANCH.name,
        });
      });
    });
  });
});
