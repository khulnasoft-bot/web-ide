import * as vscode from 'vscode';
import { showSearchableQuickPick } from './showSearchableQuickPick';
import { createVSCodeQuickPick } from '../../test-utils/createVSCodeQuickPick';
import { asDebouncedFunc } from '../../test-utils/asDebouncedFunc';

const TEST_PLACEHOLDER = 'Lorem ipsum dolar sit';
const DEFAULT_ITEMS = [
  {
    label: 'Test 1',
  },
];
const SEARCH_RESULT = [
  {
    label: 'Search 1',
  },
  {
    label: 'Search 2',
  },
  {
    label: 'Search 3',
  },
];

const SEARCH_RESULT_2 = [
  {
    label: 'Another search',
  },
];

describe('showSearchableQuickPick', () => {
  let result: Promise<vscode.QuickPickItem | undefined>;
  let quickPick: jest.Mocked<vscode.QuickPick<vscode.QuickPickItem>>;
  let searchItemsSpy: jest.Mock<Promise<vscode.QuickPickItem[]>, [string]>;
  let handleSearchErrorSpy: jest.Mock<void, []>;

  const callWithDefaultArgs = async () => {
    result = showSearchableQuickPick({
      placeholder: TEST_PLACEHOLDER,
      defaultItems: DEFAULT_ITEMS,
      searchItems: searchItemsSpy,
      handleSearchError: handleSearchErrorSpy,
    });

    quickPick = await jest.mocked(vscode.window.createQuickPick).mock.results[0]?.value;
  };

  const getChangeValueListeners = () =>
    quickPick.onDidChangeValue.mock.calls.map(([listener]) => listener);

  const triggerOnDidHide = () => {
    quickPick.onDidHide.mock.calls.forEach(([listener]) => {
      listener();
    });
  };

  const triggerAccept = (item: vscode.QuickPickItem) => {
    quickPick.activeItems = [item];
    quickPick.onDidAccept.mock.calls.forEach(([listener]) => {
      listener();
    });
  };

  const triggerChangeValue = (text: string) => {
    getChangeValueListeners().forEach(listener => listener(text));
  };

  const flushChangeValueListeners = () => {
    getChangeValueListeners()
      .map(asDebouncedFunc)
      .forEach(({ flush }) => flush());
  };

  beforeEach(() => {
    handleSearchErrorSpy = jest.fn();
    searchItemsSpy = jest.fn().mockImplementation(
      () =>
        new Promise(() => {
          // noop
        }),
    );
    jest.mocked(vscode.window.createQuickPick).mockImplementation(createVSCodeQuickPick);
  });

  describe('default', () => {
    beforeEach(() => callWithDefaultArgs());

    it('creates a quick pick', () => {
      expect(quickPick).toMatchObject({
        items: DEFAULT_ITEMS,
        placeholder: TEST_PLACEHOLDER,
        // We are busy because the "search" is still resolving
        busy: true,
      });
    });

    it('shows the quick pick', () => {
      expect(quickPick.show).toHaveBeenCalled();
      expect(quickPick.hide).not.toHaveBeenCalled();
    });

    it('calls the searchItems from options', () => {
      expect(searchItemsSpy).toHaveBeenCalledWith('');
    });

    it('is not disposed', () => {
      expect(quickPick.dispose).not.toHaveBeenCalled();
    });

    it('does not call handleSearchError', () => {
      expect(handleSearchErrorSpy).not.toHaveBeenCalled();
    });

    describe.each`
      description        | act                                      | expectation
      ${'when hidden'}   | ${() => triggerOnDidHide()}              | ${undefined}
      ${'when accepted'} | ${() => triggerAccept(DEFAULT_ITEMS[0])} | ${DEFAULT_ITEMS[0]}
    `('$description', ({ act, expectation }) => {
      beforeEach(() => {
        act();
      });

      it('disposes quickPick', () => {
        expect(quickPick.dispose).toHaveBeenCalled();
      });

      it('resolves the returned promise', async () => {
        await expect(result).resolves.toBe(expectation);
      });
    });
  });

  describe('when search resolves', () => {
    beforeEach(async () => {
      searchItemsSpy.mockResolvedValue(SEARCH_RESULT);
      await callWithDefaultArgs();
    });

    it('loads search items at start', () => {
      expect(quickPick.items).toBe(SEARCH_RESULT);
      expect(quickPick.busy).toBe(false);
    });

    describe('when value changes', () => {
      beforeEach(async () => {
        searchItemsSpy.mockClear();
        searchItemsSpy.mockResolvedValue(SEARCH_RESULT_2);

        await triggerChangeValue('lo');
        await triggerChangeValue('lore');
        await triggerChangeValue('lorem');
      });

      it('calls searchItems again after debounce', () => {
        expect(searchItemsSpy).not.toHaveBeenCalled();

        flushChangeValueListeners();

        expect(searchItemsSpy).toHaveBeenCalledTimes(1);
        expect(searchItemsSpy).toHaveBeenCalledWith('lorem');
      });

      it('shows items from search', async () => {
        flushChangeValueListeners();
        await new Promise(process.nextTick);

        expect(quickPick.items).toBe(SEARCH_RESULT_2);
      });
    });
  });

  describe('when searchItems fails', () => {
    let error: Error;

    beforeEach(async () => {
      error = new Error('Bad stuff happened');
      searchItemsSpy.mockRejectedValue(error);

      await callWithDefaultArgs();
    });

    it('calls handleSearchError', () => {
      expect(handleSearchErrorSpy).toHaveBeenCalledWith(error);
    });

    it('is not busy and keeps default items', () => {
      expect(quickPick.busy).toBe(false);
      expect(quickPick.items).toBe(DEFAULT_ITEMS);
    });
  });
});
