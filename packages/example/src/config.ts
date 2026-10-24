import type { ExtensionMarketplaceSettings } from '@khulnasoft/web-ide-types';
import { viteEnv } from './viteEnv';

const resolveUrl = (url: string) =>
  decodeURIComponent(new URL(url, window.location.href).toString());

const readBooleanFromViteEnv = (key: string, defaultValue: boolean): boolean => {
  const val = viteEnv[key];

  if (typeof val !== 'string' || val === '') {
    return defaultValue;
  }

  if (val === 'true') return true;
  if (val === 'false') return false;

  throw new Error(`Expected environment variable '${key}' to be 'true' or 'false'.`);
};

const readFromViteEnv = (key: string): string => {
  const protocol = (viteEnv.VITE_HOST_PROTOCOL || 'https').toUpperCase();
  const keyWithProtocol = `${key}_${protocol}`;

  const val = viteEnv[key] || viteEnv[keyWithProtocol];

  if (typeof val !== 'string') {
    throw new Error(
      `Expected environment variable '${key}' or '${keyWithProtocol}' to be defined.`,
    );
  }

  return val;
};

export const getEmbedderOriginUrl = () => resolveUrl(readFromViteEnv('VITE_EMBEDDER_ORIGIN_URL'));
export const getWorkbenchBaseUrl = () => resolveUrl(readFromViteEnv('VITE_WORKBENCH_BASE_URL'));
export const getExtensionsHostBaseUrl = () =>
  resolveUrl(readFromViteEnv('VITE_EXTENSIONS_HOST_BASE_URL'));

export const getCrossOriginExtensionHost = () =>
  readBooleanFromViteEnv('VITE_CROSS_ORIGIN_EXTENSION_HOST', true);

export const validateCrossOriginExtensionHost = () => {
  if (!getCrossOriginExtensionHost()) {
    return;
  }

  const extensionsHostBaseUrl = getExtensionsHostBaseUrl();
  const workbenchBaseUrl = getWorkbenchBaseUrl();
  const errors: string[] = [];

  if (!extensionsHostBaseUrl.includes('{{uuid}}')) {
    errors.push(
      'VITE_EXTENSIONS_HOST_BASE_URL must include the "{{uuid}}" template when VITE_CROSS_ORIGIN_EXTENSION_HOST is true.',
    );
  }

  if (new URL(extensionsHostBaseUrl).origin === new URL(workbenchBaseUrl).origin) {
    errors.push(
      'VITE_EXTENSIONS_HOST_BASE_URL and VITE_WORKBENCH_BASE_URL must use different origins when VITE_CROSS_ORIGIN_EXTENSION_HOST is true.',
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `[web-ide-example-app] Invalid cross-origin extension host configuration:\n- ${errors.join('\n- ')}`,
    );
  }
};

export const getRootUrlFromLocation = () => {
  const newUrl = new URL('/', window.location.href);

  return newUrl.href;
};

export const getOAuthCallbackUrl = () => {
  const url = new URL(window.location.href);
  const newUrl = new URL('oauth_callback.html', window.location.href);

  const username = url.searchParams.get('username');

  if (username) {
    newUrl.searchParams.set('username', username);
  }

  return newUrl.href;
};

export const getSettingsContextHash = async (
  extensionMarketplaceSettings: ExtensionMarketplaceSettings | undefined,
): Promise<string | undefined> => {
  if (!extensionMarketplaceSettings?.enabled) return undefined;

  // Based on: https://gitlab.com/gitlab-org/gitlab/-/blob/master/lib/web_ide/settings_sync.rb#L6-15
  const { serviceUrl, itemUrl, resourceUrlTemplate } = extensionMarketplaceSettings.vscodeSettings;
  const key = `web_ide_${serviceUrl}_${itemUrl}_${resourceUrlTemplate}`;

  const encoder = new TextEncoder();
  const data = await encoder.encode(key);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Return first 20 characters
  return hashHex.slice(0, 20);
};
