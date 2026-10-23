import { type SourceControlSystem } from '@gitlab/web-ide-fs';
import checkoutBranch from './checkoutBranch';
import * as branchUtilities from './branchUtilities';
import { showSearchableQuickPick } from '../vscodeUi';
import { TEST_COMMANDS_INITIAL_DATA } from '../../test-utils';
import { createMockSourceControl } from '../../test-utils/createMockSourceControl';

jest.mock('./branchUtilities', () => ({
  ...jest.requireActual('./branchUtilities'),
  searchBranches: jest.fn(),
  getRefFromBranchSelection: jest.fn(),
  loadRef: jest.fn(),
  handleSearchError: jest.fn(),
}));
jest.mock('../vscodeUi');

const TEST_BRANCHES = ['foo', 'foo-4', 'foo-bar'];
const TEST_BRANCH_ITEMS = TEST_BRANCHES.map(branchUtilities.mapBranchNameToQuickPickItem);
const TEST_SELECTED_BRANCH = TEST_BRANCH_ITEMS[1];
const TEST_MOCK_REF = 'foo-4';
const TEST_NEW_FEATURE_REF = 'new-feature-branch';
const CHECKOUT_PLACEHOLDER = 'Select a branch to checkout';

describe('commands/checkoutBranch', () => {
  let sourceControl: SourceControlSystem;

  const mockSearchBranches = jest.mocked(branchUtilities.searchBranches);
  const mockGetRefFromBranchSelection = jest.mocked(branchUtilities.getRefFromBranchSelection);
  const mockLoadRef = jest.mocked(branchUtilities.loadRef);
  const mockHandleSearchError = jest.mocked(branchUtilities.handleSearchError);
  const mockShowSearchableQuickPick = jest.mocked(showSearchableQuickPick);

  /**
   * Helper function to execute checkoutBranch command
   */
  const runCheckoutBranchCommand = () =>
    checkoutBranch(Promise.resolve(TEST_COMMANDS_INITIAL_DATA), sourceControl)();

  beforeEach(() => {
    sourceControl = createMockSourceControl();
    jest.clearAllMocks();

    // Set default mock implementations
    mockSearchBranches.mockResolvedValue(TEST_BRANCH_ITEMS);
    mockGetRefFromBranchSelection.mockResolvedValue(undefined);
    mockLoadRef.mockResolvedValue(undefined);
    mockHandleSearchError.mockResolvedValue(undefined);
    mockShowSearchableQuickPick.mockResolvedValue(undefined);
  });

  describe('when user cancels branch selection', () => {
    beforeEach(async () => {
      mockShowSearchableQuickPick.mockResolvedValue(undefined);
      await runCheckoutBranchCommand();
    });

    it('calls showSearchableQuickPick with correct parameters', () => {
      expect(mockShowSearchableQuickPick).toHaveBeenCalledWith({
        placeholder: CHECKOUT_PLACEHOLDER,
        defaultItems: [branchUtilities.ITEM_CREATE_NEW],
        searchItems: expect.any(Function),
        handleSearchError: expect.any(Function),
      });
    });

    it('does not call loadRef', () => {
      expect(mockLoadRef).not.toHaveBeenCalled();
    });
  });

  describe('when user selects an existing branch', () => {
    beforeEach(async () => {
      mockShowSearchableQuickPick.mockResolvedValue(TEST_SELECTED_BRANCH);
      mockGetRefFromBranchSelection.mockResolvedValue(TEST_MOCK_REF);
      await runCheckoutBranchCommand();
    });

    it('calls getRefFromBranchSelection with correct parameters', () => {
      expect(mockGetRefFromBranchSelection).toHaveBeenCalledWith(
        TEST_SELECTED_BRANCH,
        TEST_COMMANDS_INITIAL_DATA,
      );
    });

    it('calls loadRef with correct parameters', () => {
      expect(mockLoadRef).toHaveBeenCalledWith({
        projectPath: TEST_COMMANDS_INITIAL_DATA.project.path_with_namespace,
        ref: TEST_MOCK_REF,
        pageReload: true,
        sourceControl,
      });
    });
  });

  describe('when user creates new branch', () => {
    beforeEach(async () => {
      mockShowSearchableQuickPick.mockResolvedValue(branchUtilities.ITEM_CREATE_NEW);
      mockGetRefFromBranchSelection.mockResolvedValue(TEST_NEW_FEATURE_REF);
      await runCheckoutBranchCommand();
    });

    it('calls getRefFromBranchSelection with create new item', () => {
      expect(mockGetRefFromBranchSelection).toHaveBeenCalledWith(
        branchUtilities.ITEM_CREATE_NEW,
        TEST_COMMANDS_INITIAL_DATA,
      );
    });

    it('calls loadRef with correct parameters', () => {
      expect(mockLoadRef).toHaveBeenCalledWith({
        projectPath: TEST_COMMANDS_INITIAL_DATA.project.path_with_namespace,
        ref: TEST_NEW_FEATURE_REF,
        pageReload: false,
        sourceControl,
      });
    });
  });

  describe('edge cases and error scenarios', () => {
    it('handles getRefFromBranchSelection returning undefined (user cancellation)', async () => {
      mockShowSearchableQuickPick.mockResolvedValue(TEST_SELECTED_BRANCH);
      mockGetRefFromBranchSelection.mockResolvedValue(undefined);

      await runCheckoutBranchCommand();

      expect(mockLoadRef).not.toHaveBeenCalled();
    });

    it('handles branch selection with no results', async () => {
      mockSearchBranches.mockResolvedValue([]);
      mockShowSearchableQuickPick.mockResolvedValue(undefined);

      await runCheckoutBranchCommand();

      expect(mockLoadRef).not.toHaveBeenCalled();
    });
  });
});
