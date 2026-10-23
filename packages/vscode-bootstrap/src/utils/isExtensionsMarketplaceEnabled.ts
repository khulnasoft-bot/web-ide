import type { SettingsEnabled, WebIdeConfig } from '@gitlab/web-ide-types';

type WebIdeConfigWithMarketplaceEnabled = WebIdeConfig & {
  extensionMarketplaceSettings: SettingsEnabled;
};

// The Extension Marketplace is enabled only if the multi-domain architecture is enabled.
// This is a key security decision to ensure that the surface attack is limited when running
// the Web IDE on a single domain.
// MR: https://gitlab.com/gitlab-org/gitlab-web-ide/-/merge_requests/501
export const isExtensionsMarketplaceEnabled = (
  config: WebIdeConfig,
): config is WebIdeConfigWithMarketplaceEnabled =>
  Boolean(config.crossOriginExtensionHost && config.extensionMarketplaceSettings?.enabled);
