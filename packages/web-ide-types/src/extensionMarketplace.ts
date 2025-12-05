import type { VscodeExtensionsGallerySettings } from './vscode';

// These values need to match those found in
// https://gitlab.com/gitlab-org/gitlab/-/blob/22b958667a32780c9e8ae45f61aa2dcea2aab61a/lib/web_ide/settings/extensions_gallery_metadata_generator.rb#L13
export type ExtensionMarketplaceDisabledReason =
  | 'enterprise_group_disabled'
  | 'instance_disabled'
  | 'opt_in_unset'
  | 'opt_in_disabled';

export interface SettingsEnabled {
  readonly enabled: true;

  readonly vscodeSettings: VscodeExtensionsGallerySettings;
}

interface SettingsDisabled {
  readonly enabled: false;

  readonly reason?: undefined;

  readonly helpUrl?: string;
}

interface SettingsDisabledFromEnterpriseGroup {
  readonly enabled: false;

  readonly reason: 'enterprise_group_disabled';

  readonly enterpriseGroupUrl: string;

  readonly enterpriseGroupName: string;

  readonly helpUrl: string;
}

interface SettingsDisabledFromInstance {
  readonly enabled: false;

  readonly reason: 'instance_disabled';

  readonly helpUrl: string;
}

interface SettingsDisabledFromOptIn {
  readonly enabled: false;

  readonly reason: 'opt_in_unset' | 'opt_in_disabled';

  readonly userPreferencesUrl: string;

  readonly helpUrl: string;
}

export type ExtensionMarketplaceSettings =
  | SettingsEnabled
  | SettingsDisabled
  | SettingsDisabledFromEnterpriseGroup
  | SettingsDisabledFromInstance
  | SettingsDisabledFromOptIn;
