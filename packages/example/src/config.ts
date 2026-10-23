import type { ExtensionMarketplaceSettings } from '@gitlab/web-ide-types';
import { viteEnv } from './viteEnv';

const resolveUrl = (url: string) =>
  decodeURIComponent(new URL(url, window.location.href).toString());

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
