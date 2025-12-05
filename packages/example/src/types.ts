import type { AuthType, ExtensionMarketplaceDisabledReason } from '@gitlab/web-ide-types';

export interface ExampleConfig {
  gitlabUrl: string;
  projectPath: string;
  gitRef: string;
  codeSuggestionsEnabled: boolean;
  authType: AuthType;
  gitlabToken: string;
  clientId: string;
  telemetryEnabled: boolean;
  extensionMarketplaceEnabled: boolean;
  settingsContextHash: string | undefined;
  extensionMarketplaceDisabledReason: ExtensionMarketplaceDisabledReason | undefined;
  languageServerEnabled: boolean;
}

export type ExampleConfigKeys = keyof ExampleConfig;

export const SENSITIVE_KEYS: ExampleConfigKeys[] = ['gitlabToken'];

/**
 * Payload object that represents the user's settings and is saved/loaded from local storage
 */
export interface ExampleConfigPayload {
  config: ExampleConfig;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isExampleConfigPayload = (obj: any): obj is ExampleConfigPayload =>
  obj && typeof obj === 'object' && typeof obj.config === 'object';
