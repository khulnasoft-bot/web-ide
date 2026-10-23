import type { VscodeExtensionsGallerySettings, LogLevel } from '@gitlab/web-ide-types';

// region: VSCode module paths -----------------------------------------

export const MODULE_WORKBENCH_MAIN = 'vs/workbench/workbench.web.main';

// region: VSCode internal types ---------------------------------------

// Thia should match https://gitlab.com/gitlab-org/gitlab-web-ide-vscode-fork/-/blob/322bc2d7d86e8d0c2ccb1bfdabe594e2011d500f/src/vs/workbench/services/authentication/browser/authenticationService.ts#L81
export type AuthenticationSessionInfo = {
  readonly id: string;
  readonly accessToken: string;
  readonly providerId: string;
  readonly canSignOut?: boolean;
};

// This should match https://gitlab.com/gitlab-org/gitlab-web-ide-vscode-fork/-/blob/main/src/vs/platform/secrets/common/secrets.ts
// eslint-disable-next-line
export interface ISecretStorageProvider {
  type: 'in-memory' | 'persisted' | 'unknown';
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

// ConfigurationSyncStore from https://gitlab.com/gitlab-org/gitlab-web-ide-vscode-fork/-/blob/1d73a472ba0d877370eb35d282ea4720175f855f/src/vs/base/common/product.ts#L39
export type ConfigurationSyncStore = {
  url: string;
  insidersUrl: string;
  stableUrl: string;
  canSwitch: boolean;
  authenticationProviders: Record<string, { scopes: string[] }>;
};

/**
 * Settings sync options from https://gitlab.com/gitlab-org/gitlab-web-ide-vscode-fork/-/blob/1076180257af86c0f540faf7f6087041bd37ef8c/src/vs/workbench/browser/web.api.ts#L651
 */
export type ISettingsSyncOptions = {
  readonly enabled: boolean;
  readonly extensionsSyncStateVersion?: string;
} & Record<string, unknown>;

export type IProductConfiguration = {
  readonly 'configurationSync.store'?: ConfigurationSyncStore;
  readonly webEndpointUrlTemplate?: string;
  readonly extensionsGallery?: VscodeExtensionsGallerySettings;
} & Record<string, unknown>;

// IDevelopmentOptions from https://gitlab.com/gitlab-org/gitlab-web-ide-vscode-fork/-/blob/1076180257af86c0f540faf7f6087041bd37ef8c/src/vs/workbench/browser/web.api.ts#L670
// eslint-disable-next-line @typescript-eslint/naming-convention
interface IDevelopmentOptions {
  /**
   * Current logging level. Default is `LogLevel.Info`.
   */
  readonly logLevel?: LogLevel;
}

// IWorkbenchConstructionOptions from https://gitlab.com/gitlab-org/gitlab-web-ide-vscode-fork/-/blob/1076180257af86c0f540faf7f6087041bd37ef8c/src/vs/workbench/browser/web.api.ts#L127
// TODO: It would be great to figure out how we can reuse the typing from the vscode-fork
export type IWorkbenchConstructionOptions = {
  readonly configurationDefaults?: Record<string, unknown>;
  readonly productConfiguration?: IProductConfiguration;
  readonly additionalTrustedDomains?: string[];
  readonly messagePorts?: ReadonlyMap<string, MessagePort>;
  readonly settingsSyncOptions?: ISettingsSyncOptions;
  readonly developmentOptions?: IDevelopmentOptions;
} & Record<string, unknown>;

// https://gitlab.com/gitlab-org/gitlab-web-ide-vscode-fork/-/blob/fa3eb589de07ab4db0500c32519ce41940c11241/src/vs/base/common/uri.ts#L98
export type URI = unknown;

// IDisposable from https://gitlab.com/gitlab-org/gitlab-web-ide-vscode-fork/-/blob/fa3eb589de07ab4db0500c32519ce41940c11241/src/vs/base/common/lifecycle.ts#L119
// eslint-disable-next-line
export interface IDisposable {
  dispose(): void;
}

// https://gitlab.com/gitlab-org/gitlab-web-ide-vscode-fork/-/blob/03eeab97952dc1d10f846b0f3ebd404e941ddf7a/src/vs/workbench/workbench.web.main.ts#L194
export interface WorkbenchModule {
  create(el: Element, options: IWorkbenchConstructionOptions): IDisposable;
  readonly logger: {
    log(level: LogLevel, message: string): void;
  };
  readonly URI: {
    parse(x: string): URI;
    from(x: Record<string, string>): unknown;
  };
}
