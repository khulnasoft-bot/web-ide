import { type SourceControlSystem } from '@gitlab/web-ide-fs';
import * as vscode from 'vscode';
import { TEST_COMMANDS_INITIAL_DATA, TEST_PROJECT, TEST_REF_BRANCH } from '../../test-utils';
import { createMockSourceControl } from '../../test-utils/createMockSourceControl';
import { RELOAD_COMMAND_ID, RELOAD_WITH_WARNING_COMMAND_ID } from '../constants';
import { createProjectBranch, fetchProjectBranches } from '../mediator';
import { showInputBox, showSearchableQuickPick } from '../vscodeUi';
import type { LoadRefOptions } from './branchUtilities';
import {
  getRefFromBranchSelection,
  handleSearchError,
  ITEM_CREATE_NEW,
  ITEM_NOT_FOUND,
  loadRef,
  mapBranchNameToQuickPickItem,
  searchBranches,
  selectBranch,
  showCreateBranchPrompt,
} from './branchUtilities';

jest.mock('../mediator', () => ({
  createProjectBranch: jest.fn(),
  fetchProjectBranches: jest.fn(),
}));

jest.mock('../vscodeUi', () => ({
  showInputBox: jest.fn(),
  showSearchableQuickPick: jest.fn(),
}));

describe('branchUtilities', () => {
  let sourceControl: SourceControlSystem;
  const mockCreateProjectBranch = jest.mocked(createProjectBranch);
  const mockFetchProjectBranches = jest.mocked(fetchProjectBranches);
  const mockShowInputBox = jest.mocked(showInputBox);
  const mockShowSearchableQuickPick = jest.mocked(showSearchableQuickPick);
  const defaultItems = [
    {
      type: 'current' as const,
      label: '$(git-branch) main (current)',
      ref: 'main',
      alwaysShow: true,
    },
  ];

  beforeEach(() => {
    sourceControl = createMockSourceControl();
    jest.clearAllMocks();
  });

  describe('mapBranchNameToQuickPickItem', () => {
    it('should transform a branch name into a VS Code QuickPick item', () => {
      const result = mapBranchNameToQuickPickItem('feature-branch');

      expect(result).toEqual({
        type: 'existing-branch',
        alwaysShow: false,
        label: '$(git-branch) feature-branch',
        ref: 'feature-branch',
      });
    });
  });

  describe('handleSearchError - error logging and user notification', () => {
    let consoleSpy: jest.SpyInstance;
    let error: Error;
    beforeEach(async () => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      error = new Error('Test error');
      await handleSearchError(error);
    });
    it('should log error information to the console', async () => {
      expect(consoleSpy).toHaveBeenCalledWith(
        '[gitlab-webide] Error occurred while searching for branches',
        error,
      );
      consoleSpy.mockRestore();
    });
    it('should display a user-friendly warning message', async () => {
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        'Error while searching for branches. Please try again or check the developer console for details.',
      );
    });
  });

  describe('searchBranches - branch discovery and filtering functionality', () => {
    it('should return found branches and default items when search yields results', async () => {
      mockFetchProjectBranches.mockResolvedValue(['feature-1']);
      const result = await searchBranches('feature', defaultItems, 'test-project');

      const expectedItems = [
        ...defaultItems,
        {
          type: 'existing-branch',
          alwaysShow: false,
          label: '$(git-branch) feature-1',
          ref: 'feature-1',
        },
      ];
      expect(result).toEqual(expectedItems);
    });

    it('should return not-found indicator when no branches match search criteria', async () => {
      mockFetchProjectBranches.mockResolvedValue([]);

      const result = await searchBranches('nonexistent', [], 'test-project');

      expect(result).toEqual([ITEM_NOT_FOUND]);
    });

    it('should perform dual search strategy with exact and wildcard patterns', async () => {
      mockFetchProjectBranches.mockResolvedValue(['feature-branch']);

      await searchBranches('feature', defaultItems, 'test-project');

      expect(mockFetchProjectBranches).toHaveBeenCalledTimes(2);
      expect(mockFetchProjectBranches).toHaveBeenCalledWith({
        projectPath: 'test-project',
        searchPattern: 'feature',
        offset: 0,
        limit: 1,
      });
      expect(mockFetchProjectBranches).toHaveBeenCalledWith({
        projectPath: 'test-project',
        searchPattern: '*feature*',
        offset: 0,
        limit: 100,
      });
    });

    it('should search with wildcard when no specific pattern is provided', async () => {
      mockFetchProjectBranches.mockResolvedValue(['main', 'develop']);

      await searchBranches('', defaultItems, 'test-project');

      expect(mockFetchProjectBranches).toHaveBeenCalledWith({
        projectPath: 'test-project',
        searchPattern: '*',
        offset: 0,
        limit: 100,
      });
    });
  });

  describe('showCreateBranchPrompt - interactive branch creation with validation', () => {
    const options = {
      project: { ...TEST_PROJECT, empty_repo: false },
      baseRef: TEST_REF_BRANCH.sha,
    };

    it('should return valid branch name after successful validation', async () => {
      mockShowInputBox.mockResolvedValue({ canceled: false, value: 'new-feature' });
      mockCreateProjectBranch.mockResolvedValue({ errors: [], branch: { name: 'new-feature' } });

      const result = await showCreateBranchPrompt(options);

      expect(result).toBe('new-feature');
      expect(mockShowInputBox).toHaveBeenCalledWith({
        placeholder: 'Branch name',
        prompt: 'Please provide a new branch name',
        onSubmit: expect.any(Function),
      });
    });

    it('should return undefined when user cancels the input dialog', async () => {
      mockShowInputBox.mockResolvedValue({ canceled: true });

      const result = await showCreateBranchPrompt(options);

      expect(result).toBeUndefined();
    });

    it('should reject empty branch names with appropriate error message', async () => {
      const onSubmit = jest.fn();
      mockShowInputBox.mockImplementation(({ onSubmit: callback }) => {
        onSubmit.mockImplementation(callback);
        return Promise.resolve({ canceled: false, value: 'test' });
      });

      await showCreateBranchPrompt(options);
      const validationResult = await onSubmit('');

      expect(validationResult).toBe('Branch name cannot be empty.');
    });

    it('should accept any branch name for empty repositories without API validation', async () => {
      const emptyRepoOptions = {
        ...options,
        project: { ...TEST_PROJECT, empty_repo: true },
      };
      const onSubmit = jest.fn();
      mockShowInputBox.mockImplementation(({ onSubmit: callback }) => {
        onSubmit.mockImplementation(callback);
        return Promise.resolve({ canceled: false, value: 'test' });
      });

      await showCreateBranchPrompt(emptyRepoOptions);
      const validationResult = await onSubmit('new-branch');

      expect(validationResult).toBeUndefined();
      expect(mockCreateProjectBranch).not.toHaveBeenCalled();
    });

    it('should return server validation errors for duplicate branch names', async () => {
      const onSubmit = jest.fn();
      mockShowInputBox.mockImplementation(({ onSubmit: callback }) => {
        onSubmit.mockImplementation(callback);
        return Promise.resolve({ canceled: false, value: 'test' });
      });
      mockCreateProjectBranch.mockResolvedValue({
        errors: ['Branch already exists'],
        branch: { name: 'existing-branch' },
      });

      await showCreateBranchPrompt(options);
      const validationResult = await onSubmit('existing-branch');

      expect(validationResult).toBe('Branch already exists');
    });

    it('should handle API failures with user-friendly error messages', async () => {
      const onSubmit = jest.fn();
      mockShowInputBox.mockImplementation(({ onSubmit: callback }) => {
        onSubmit.mockImplementation(callback);
        return Promise.resolve({ canceled: false, value: 'test' });
      });
      mockCreateProjectBranch.mockRejectedValue(new Error('API Error'));

      await showCreateBranchPrompt(options);
      const validationResult = await onSubmit('new-branch');

      expect(validationResult).toBe(
        'An unexpected error occurred while creating the branch. Please try again.',
      );
    });
  });

  describe('loadRef - workspace navigation with change detection', () => {
    let loadOptions: LoadRefOptions;
    beforeEach(() => {
      loadOptions = {
        projectPath: 'test-project',
        ref: 'feature-branch',
        pageReload: false,
        sourceControl,
      };
    });
    it('should check source control status for uncommitted changes', async () => {
      await loadRef(loadOptions);

      expect(sourceControl.status).toHaveBeenCalled();
    });

    it('should execute direct reload when workspace has no pending changes', async () => {
      sourceControl.status = jest.fn().mockResolvedValue([]);

      await loadRef(loadOptions);

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(RELOAD_COMMAND_ID, {
        ref: 'feature-branch',
        projectPath: 'test-project',
        pageReload: false,
      });
    });

    it('should show confirmation dialog when uncommitted changes would be lost', async () => {
      sourceControl.status = jest.fn().mockResolvedValue([{ status: 'modified', path: 'file.ts' }]);

      await loadRef(loadOptions);

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(RELOAD_WITH_WARNING_COMMAND_ID, {
        message:
          'Are you sure you want to checkout "feature-branch"? Any unsaved changes will be lost.',
        okText: 'Yes',
        ref: 'feature-branch',
      });
    });
  });

  describe('getRefFromBranchSelection - branch reference extraction', () => {
    it('should return undefined when no branch is selected', async () => {
      const result = await getRefFromBranchSelection(undefined, TEST_COMMANDS_INITIAL_DATA);
      expect(result).toBeUndefined();
    });

    it('should return undefined for not-found placeholder selections', async () => {
      const result = await getRefFromBranchSelection(ITEM_NOT_FOUND, TEST_COMMANDS_INITIAL_DATA);
      expect(result).toBeUndefined();
    });

    it('should extract reference from existing branch selections', async () => {
      const selection = {
        type: 'existing-branch' as const,
        ref: 'feature-branch',
        label: 'Feature Branch',
      };

      const result = await getRefFromBranchSelection(selection, TEST_COMMANDS_INITIAL_DATA);
      expect(result).toBe('feature-branch');
    });

    it('should trigger branch creation workflow for new branch selections', async () => {
      mockShowInputBox.mockResolvedValue({ canceled: false, value: 'new-branch' });
      mockCreateProjectBranch.mockResolvedValue({ errors: [], branch: { name: 'new-branch' } });

      const result = await getRefFromBranchSelection(ITEM_CREATE_NEW, TEST_COMMANDS_INITIAL_DATA);

      expect(result).toBe('new-branch');
    });
  });

  describe('selectBranch - interactive branch selection', () => {
    it('should return selected branch reference from user choice', async () => {
      const selectedBranch = {
        type: 'existing-branch' as const,
        ref: 'feature-branch',
        label: '$(git-branch) feature-branch',
      };
      mockShowSearchableQuickPick.mockResolvedValue(selectedBranch);

      const result = await selectBranch(TEST_COMMANDS_INITIAL_DATA, 'Select branch');

      expect(result).toBe('feature-branch');
      expect(mockShowSearchableQuickPick).toHaveBeenCalledWith({
        placeholder: 'Select branch',
        defaultItems: expect.arrayContaining([
          expect.objectContaining({
            type: 'current',
            label: '$(git-branch) main (current)',
            ref: 'main',
          }),
        ]),
        searchItems: expect.any(Function),
        handleSearchError,
      });
    });

    it('should return undefined when user cancels the selection dialog', async () => {
      mockShowSearchableQuickPick.mockResolvedValue(undefined);

      const result = await selectBranch(TEST_COMMANDS_INITIAL_DATA);

      expect(result).toBeUndefined();
    });

    it('should return undefined when user selects the not-found placeholder', async () => {
      mockShowSearchableQuickPick.mockResolvedValue(ITEM_NOT_FOUND);

      const result = await selectBranch(TEST_COMMANDS_INITIAL_DATA);

      expect(result).toBeUndefined();
    });

    it('should display commit SHA as current branch for detached HEAD state', async () => {
      const commitData = {
        ...TEST_COMMANDS_INITIAL_DATA,
        ref: { type: 'commit' as const, sha: 'abc123' },
      };
      mockShowSearchableQuickPick.mockResolvedValue(undefined);

      await selectBranch(commitData);

      expect(mockShowSearchableQuickPick).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultItems: expect.arrayContaining([
            expect.objectContaining({
              label: '$(git-branch) abc123 (current)',
              ref: 'abc123',
            }),
          ]),
        }),
      );
    });

    it('should handle inline branch creation through the selection interface', async () => {
      mockShowSearchableQuickPick.mockResolvedValue(ITEM_CREATE_NEW);
      mockShowInputBox.mockResolvedValue({ canceled: false, value: 'new-feature' });
      mockCreateProjectBranch.mockResolvedValue({ errors: [], branch: { name: 'new-feature' } });

      const result = await selectBranch(TEST_COMMANDS_INITIAL_DATA);

      expect(result).toBe('new-feature');
    });
  });
});
