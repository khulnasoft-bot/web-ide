import type { WebIdeConfig } from '@khulnasoft/web-ide-types';
import { storageAvailable } from './utils/storageAvailable';
import { vsCodeWebExtensionsStore } from './utils/vsCodeWebExtensionsStore';
import { isExtensionsMarketplaceEnabled } from './utils/isExtensionsMarketplaceEnabled';

export const VSCODE_EXTENSION_MARKETPLACE_STORAGE_KEY = 'web_ide_extension_marketplace';
export const EXTENSION_MARKETPLACE_SETTINGS_CONTEXT_HASH_KEY =
  'web_ide_last_extensions_marketplace_settings_context_hash';

export function setToLocalStorage<T>(key: string, value: T) {
  const canUseLocalStorage = storageAvailable('localStorage');

  if (!canUseLocalStorage) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Error occurred trying to save ${key}=${value} in localStorage`, e);
  }
}

export const getFromLocalStorage = (key: string) => {
  const value = window.localStorage.getItem(key);

  if (!value) return undefined;

  return JSON.parse(value);
};

function shouldClearExtensionsBySettingsContext(config: WebIdeConfig) {
  const isMarketplaceEnabled = config.extensionMarketplaceSettings?.enabled;

  if (!isMarketplaceEnabled) return false;

  const { settingsContextHash } = config;
  const lastSettingsContextHash = getFromLocalStorage(
    EXTENSION_MARKETPLACE_SETTINGS_CONTEXT_HASH_KEY,
  );

  // We want to prevent clearing extensions settings when no `lastSettingsContextHash` exists
  // so that users can migrate their extensions over to settings context hash
  return (
    settingsContextHash &&
    lastSettingsContextHash &&
    lastSettingsContextHash !== settingsContextHash
  );
}

function shouldClearExtensionsByMarketplaceEnablement(config: WebIdeConfig) {
  const isMarketplaceLastEnabled = getFromLocalStorage(VSCODE_EXTENSION_MARKETPLACE_STORAGE_KEY);

  // If marketplace was previously enabled but is now disabled
  return !isExtensionsMarketplaceEnabled(config) && isMarketplaceLastEnabled;
}

function shouldClearWebIdeExtensions(config: WebIdeConfig) {
  const canUseLocalStorage = storageAvailable('localStorage');

  // If we can't use localStorage for some reason, assume we need to clear extensions
  if (!canUseLocalStorage) return true;

  if (shouldClearExtensionsByMarketplaceEnablement(config)) return true;

  if (shouldClearExtensionsBySettingsContext(config)) return true;

  return false;
}

function saveConfigStateInLocalStorage(config: WebIdeConfig) {
  const { settingsContextHash } = config;
  const isMarketplaceEnabled = isExtensionsMarketplaceEnabled(config);

  setToLocalStorage(VSCODE_EXTENSION_MARKETPLACE_STORAGE_KEY, isMarketplaceEnabled || false);
  setToLocalStorage(EXTENSION_MARKETPLACE_SETTINGS_CONTEXT_HASH_KEY, settingsContextHash || '');
}

export const cleanWebIdeExtensions = async (config: WebIdeConfig) => {
  const shouldUseCrossOriginExtensionHost = config.crossOriginExtensionHost;

  const shouldClearExtensions = shouldClearWebIdeExtensions(config);

  if (shouldClearExtensions) {
    try {
      await Promise.all([
        vsCodeWebExtensionsStore.removeExtensions(),
        vsCodeWebExtensionsStore.removeLastSyncedExtensionsData(),
      ]);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error occurred trying to clear possibly installed marketplace extensions', e);

      // If we're not forcing cross origin extension host, then we have to blow up...
      if (!shouldUseCrossOriginExtensionHost) {
        throw e;
      }
    }
  }

  saveConfigStateInLocalStorage(config);
};
