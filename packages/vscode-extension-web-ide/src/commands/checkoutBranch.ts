import type { SourceControlSystem } from '@gitlab/web-ide-fs';
import type { CommandsInitialData } from '../types';
import { showSearchableQuickPick } from '../vscodeUi';
import type { BranchQuickPickItem } from './branchUtilities';
import {
  getRefFromBranchSelection,
  handleSearchError,
  ITEM_CREATE_NEW,
  loadRef,
  searchBranches,
} from './branchUtilities';

const MSG_SELECT_BRANCH = 'Select a branch to checkout';

/**
 * Specialized branch selection for checkout operations that supports creating new branches
 */
const selectBranchForCheckout = async (
  options: CommandsInitialData,
): Promise<{ ref: string; pageReload: boolean } | undefined> => {
  const defaultItems = options.userPermissions.pushCode ? [ITEM_CREATE_NEW] : [];

  const selection = await showSearchableQuickPick<BranchQuickPickItem>({
    placeholder: MSG_SELECT_BRANCH,
    defaultItems,
    searchItems: async (searchPattern: string): Promise<BranchQuickPickItem[]> => {
      // Use the existing searchBranches function
      const branches = await searchBranches(searchPattern, [], options.project.path_with_namespace);

      // Convert to checkout-compatible format
      const checkoutBranches: BranchQuickPickItem[] = branches
        .filter(item => item.type === 'existing-branch')
        .map(item => ({
          type: 'existing-branch' as const,
          label: item.label,
          ref: item.ref,
          alwaysShow: false,
        }));

      const allItems = [...defaultItems, ...checkoutBranches];

      return allItems.length > defaultItems.length
        ? allItems
        : [
            ...defaultItems,
            { type: 'not-found' as const, alwaysShow: true, label: 'No branches found' },
          ];
    },
    handleSearchError,
  });

  const ref = await getRefFromBranchSelection(selection, options);
  if (!ref) {
    return undefined;
  }

  const pageReload = selection?.type === 'existing-branch';
  return { ref, pageReload };
};

// region: command factory and handler ---------------------------------
export default (asyncOptions: Thenable<CommandsInitialData>, sourceControl: SourceControlSystem) =>
  async () => {
    const options = await asyncOptions;

    // Use the specialized checkout function that handles both existing branches and new branch creation
    const result = await selectBranchForCheckout(options);

    // User canceled the selection
    if (!result) {
      return;
    }

    const { ref, pageReload } = result;

    await loadRef({
      projectPath: options.project.path_with_namespace,
      ref,
      pageReload,
      sourceControl,
    });
  };
