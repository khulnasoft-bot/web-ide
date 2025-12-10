import { DefaultGitLabClient } from '@khulnasoft/khulnasoft-api-client';
import {
  createWebIdeExtensionConfig,
  createFakePartial,
  withFakeIndexedDbStorage,
} from '@khulnasoft/utils-test';
import type { WebIdeConfig, VscodeExtensionsGallerySettings } from '@khulnasoft/web-ide-types';
import type { ApiRequest } from '@khulnasoft/web-ide-interop';
import {
  VSCODE_EXTENSIONS_KEY,
  VSCODE_EXTENSIONS_LAST_SYNCED_KEY,
  VSCODE_GLOBAL_STATE_DB_NAME,
  VSCODE_STATE_DATA_STORE,
  VSCODE_USER_DATA_STORE,
  VSCODE_WEB_DB_NAME,
} from './utils/vsCodeWebExtensionsStore';
import {
  cleanWebIdeExtensions,
  EXTENSION_MARKETPLACE_SETTINGS_CONTEXT_HASH_KEY,
  getFromLocalStorage,
  VSCODE_EXTENSION_MARKETPLACE_STORAGE_KEY,
} from './cleanExtensions';

const MOCK_SETTINGS_CONTEXT_HASH = '1234';
const MOCK_CONFIG = createWebIdeExtensionConfig();
const getMockExtensionsEnabledConfig = (settingsContextHash?: string): WebIdeConfig => ({
  ...MOCK_CONFIG,
  crossOriginExtensionHost: true,
  settingsContextHash,
  extensionMarketplaceSettings: {
    enabled: true,
    vscodeSettings: createFakePartial<VscodeExtensionsGallerySettings>({}),
  },
});
const MOCK_EXTENSIONS_ENABLED_CONFIG = getMockExtensionsEnabledConfig();
const MOCK_EXTENSIONS_DISABLED_CONFIG: WebIdeConfig = {
  ...MOCK_CONFIG,
  crossOriginExtensionHost: true,
  extensionMarketplaceSettings: {
    enabled: false,
  },
};
const MOCK_EXTENSIONS_CROSS_ORIGIN_DISABLED_CONFIG: WebIdeConfig = {
  ...MOCK_CONFIG,
  crossOriginExtensionHost: false,
  extensionMarketplaceSettings: {
    enabled: true,
    vscodeSettings: createFakePartial<VscodeExtensionsGallerySettings>({}),
  },
};

const MOCK_EXTENSIONS_ALL_DISABLED_CONFIG: WebIdeConfig = {
  ...MOCK_CONFIG,
  crossOriginExtensionHost: false,
  extensionMarketplaceSettings: {
    enabled: false,
  },
};

describe('cleanExtensions', () => {
  let fetchSpy: jest.SpyInstance<Promise<unknown>, [ApiRequest<unknown>]>;
  const indexedDbHelpers = withFakeIndexedDbStorage();

  const mockVsCodeWebExtensionsStore = {
    getExtensions: () =>
      indexedDbHelpers.getFromObjectStore(
        VSCODE_WEB_DB_NAME,
        VSCODE_USER_DATA_STORE,
        VSCODE_EXTENSIONS_KEY,
      ),
    getLastSyncedExtensionsData: () =>
      indexedDbHelpers.getFromObjectStore(
        VSCODE_GLOBAL_STATE_DB_NAME,
        VSCODE_STATE_DATA_STORE,
        VSCODE_EXTENSIONS_LAST_SYNCED_KEY,
      ),
  };

  beforeEach(() => {
    fetchSpy = jest
      .spyOn(DefaultGitLabClient.prototype, 'fetchFromApi')
      .mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  const expectExtensionsDataCleared = async () => {
    await expect(mockVsCodeWebExtensionsStore.getExtensions()).resolves.toBeUndefined();
    await expect(
      mockVsCodeWebExtensionsStore.getLastSyncedExtensionsData(),
    ).resolves.toBeUndefined();
  };

  const expectExtensionsDataIntact = async () => {
    await expect(mockVsCodeWebExtensionsStore.getExtensions()).resolves.toBe('value');
    await expect(mockVsCodeWebExtensionsStore.getLastSyncedExtensionsData()).resolves.toBe('value');
  };

  describe('with VsCodeWebExtensionsStore', () => {
    beforeEach(async () => {
      await indexedDbHelpers.populateObjectStoreWithMockData(
        VSCODE_WEB_DB_NAME,
        VSCODE_USER_DATA_STORE,
        VSCODE_EXTENSIONS_KEY,
      );
      await indexedDbHelpers.populateObjectStoreWithMockData(
        VSCODE_GLOBAL_STATE_DB_NAME,
        VSCODE_STATE_DATA_STORE,
        VSCODE_EXTENSIONS_LAST_SYNCED_KEY,
      );
    });

    it.each`
      action         | beforeLabel   | beforeValue                        | currentLabel                                        | currentValue                                    | cleanupExpectation
      ${'preserves'} | ${'disabled'} | ${MOCK_EXTENSIONS_DISABLED_CONFIG} | ${'disabled'}                                       | ${MOCK_EXTENSIONS_DISABLED_CONFIG}              | ${expectExtensionsDataIntact}
      ${'preserves'} | ${'enabled'}  | ${MOCK_EXTENSIONS_ENABLED_CONFIG}  | ${'enabled'}                                        | ${MOCK_EXTENSIONS_ENABLED_CONFIG}               | ${expectExtensionsDataIntact}
      ${'preserves'} | ${'disabled'} | ${MOCK_EXTENSIONS_DISABLED_CONFIG} | ${'enabled'}                                        | ${MOCK_EXTENSIONS_ENABLED_CONFIG}               | ${expectExtensionsDataIntact}
      ${'cleans up'} | ${'enabled'}  | ${MOCK_EXTENSIONS_ENABLED_CONFIG}  | ${'disabled'}                                       | ${MOCK_EXTENSIONS_DISABLED_CONFIG}              | ${expectExtensionsDataCleared}
      ${'cleans up'} | ${'enabled'}  | ${MOCK_EXTENSIONS_ENABLED_CONFIG}  | ${'cross origin disabled'}                          | ${MOCK_EXTENSIONS_CROSS_ORIGIN_DISABLED_CONFIG} | ${expectExtensionsDataCleared}
      ${'cleans up'} | ${'enabled'}  | ${MOCK_EXTENSIONS_ENABLED_CONFIG}  | ${'cross origin disabled and marketplace disabled'} | ${MOCK_EXTENSIONS_ALL_DISABLED_CONFIG}          | ${expectExtensionsDataCleared}
    `(
      '$action extensions if extensions marketplace is $beforeLabel before and currently $currentLabel',
      async ({ beforeValue, currentValue, cleanupExpectation }) => {
        await cleanWebIdeExtensions(beforeValue);
        await cleanWebIdeExtensions(currentValue);

        await cleanupExpectation();
        expect(fetchSpy).not.toHaveBeenCalled();
      },
    );

    it('sets latest extension marketplace enabled value in local storage', async () => {
      await cleanWebIdeExtensions(MOCK_EXTENSIONS_DISABLED_CONFIG);
      await cleanWebIdeExtensions(MOCK_EXTENSIONS_ENABLED_CONFIG);

      expect(getFromLocalStorage(VSCODE_EXTENSION_MARKETPLACE_STORAGE_KEY)).toBe(true);
    });

    it.each`
      label                                                             | config
      ${'marketplace is disabled'}                                      | ${MOCK_EXTENSIONS_DISABLED_CONFIG}
      ${'marketplace is enabled and no settings context hash provided'} | ${MOCK_EXTENSIONS_ENABLED_CONFIG}
    `('does not set last settings context hash in local storage if $label', async ({ config }) => {
      await cleanWebIdeExtensions(config);

      expect(getFromLocalStorage(EXTENSION_MARKETPLACE_SETTINGS_CONTEXT_HASH_KEY)).toBe('');
    });

    describe('with extensions marketplace enabled and settings context hash provided', () => {
      const mockExtensionsEnabledConfig = getMockExtensionsEnabledConfig(
        MOCK_SETTINGS_CONTEXT_HASH,
      );

      it('should set last settings context hash in local storage', async () => {
        await cleanWebIdeExtensions(mockExtensionsEnabledConfig);

        expect(getFromLocalStorage(EXTENSION_MARKETPLACE_SETTINGS_CONTEXT_HASH_KEY)).toBe('1234');
      });

      it('should not clear extensions  if settings context hash has not changed', async () => {
        await expectExtensionsDataIntact();

        await cleanWebIdeExtensions(mockExtensionsEnabledConfig);

        await expectExtensionsDataIntact();
      });

      it('should clear extensions if settings context hash changed', async () => {
        await expectExtensionsDataIntact();

        await cleanWebIdeExtensions(mockExtensionsEnabledConfig);
        await cleanWebIdeExtensions(getMockExtensionsEnabledConfig('5678'));

        await expectExtensionsDataCleared();
      });
    });
  });

  describe('without VsCodeWebExtensionsStore', () => {
    it('should not throw', async () => {
      await cleanWebIdeExtensions(MOCK_EXTENSIONS_ENABLED_CONFIG);

      await expect(cleanWebIdeExtensions(MOCK_EXTENSIONS_DISABLED_CONFIG)).resolves.toBeUndefined();
    });
  });
});
