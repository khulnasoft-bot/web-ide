import { debounce } from 'lodash';
import * as vscode from 'vscode';
import { queueAsyncCalls } from '../utils/queueAsyncCalls';

export interface SearchableQuickPickOptions<T extends vscode.QuickPickItem> {
  placeholder: string;
  searchItems: (searchPattern: string) => Promise<T[]>;
  handleSearchError: (e: unknown) => void;
  defaultItems?: T[];
}

const updateQuickPickSearch = async <T extends vscode.QuickPickItem>(
  quickPick: vscode.QuickPick<T>,
  { searchItems, handleSearchError }: SearchableQuickPickOptions<T>,
  searchPattern: string,
) => {
  // eslint-disable-next-line no-param-reassign
  quickPick.busy = true;

  try {
    const newItems = await searchItems(searchPattern);

    // eslint-disable-next-line no-param-reassign
    quickPick.items = newItems;
  } catch (e) {
    handleSearchError(e);
  } finally {
    // eslint-disable-next-line no-param-reassign
    quickPick.busy = false;
  }
};

export const showSearchableQuickPick = async <T extends vscode.QuickPickItem>(
  options: SearchableQuickPickOptions<T>,
): Promise<T | undefined> => {
  const { placeholder, defaultItems = [] } = options;

  const queuedSearch = queueAsyncCalls(updateQuickPickSearch);

  const quickPick = await vscode.window.createQuickPick<T>();
  quickPick.items = defaultItems;
  quickPick.placeholder = placeholder;
  quickPick.onDidChangeValue(
    debounce((text: string) => queuedSearch(quickPick, options, text), 200),
  );

  quickPick.show();

  queuedSearch(quickPick, options, '');

  const val = await new Promise<T | undefined>(resolve => {
    quickPick.onDidAccept(() => resolve(quickPick.activeItems[0]));
    quickPick.onDidHide(() => resolve(undefined));
  });

  quickPick.dispose();

  return val;
};
