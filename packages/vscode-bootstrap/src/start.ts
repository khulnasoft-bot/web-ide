import './amd/global.d';

import type { WebIdeExtensionConfig, WebIdeConfig } from '@khulnasoft/web-ide-types';
import { LogLevel } from '@khulnasoft/web-ide-types';
import { escapeCssQuotedValue } from '@khulnasoft/utils-escape';
import { joinPaths } from '@khulnasoft/utils-path';
import { getAuthProvider } from '@gitlab/gitlab-api-client-factory';
import { WEB_IDE_EXTENSION_ID } from '@khulnasoft/web-ide-interop';
import { DefaultCrossWindowChannel } from '@gitlab/cross-origin-channel';
import type {
  WorkbenchModule,
  IWorkbenchConstructionOptions,
  ConfigurationSyncStore,
} from './vscode';
import { MODULE_WORKBENCH_MAIN, createDefaultSecretStorageProvider } from './vscode';
import { MessagePortsController } from './utils/MessagePortsController';
import { DEFAULT_DOCUMENTATION_URL, DEFAULT_SESSION_ID } from './constant';
import { cleanWebIdeExtensions } from './cleanExtensions';
import { isExtensionsMarketplaceEnabled } from './utils/isExtensionsMarketplaceEnabled';

const getDomainFromFullUrl = (urlStr: string) => {
  const url = new URL(urlStr);

  return url.host;
};

const amdModuleName = (funcName: string) => `khulnasoft-web-ide/${funcName}`;

const SETTINGS_SYNC_OPTIONS = {
  enabled: true,
  extensionsSyncStateVersion: '1.0.0',
  authenticationProvider: {
    id: 'khulnasoft-web-ide',
    signIn() {
      return Promise.resolve(DEFAULT_SESSION_ID);
    },
  },
};

const BASE_OPTIONS: Partial<IWorkbenchConstructionOptions> = {
  // implements IWorkbenchConstructionOptions https://gitlab.com/khulnasoft/web-ide-vscode-fork/-/blob/1076180257af86c0f540faf7f6087041bd37ef8c/src/vs/workbench/browser/web.api.ts#L127

  homeIndicator: {
    href: 'https://gitlab.com',
    icon: 'code',
    title: 'GitLab',
  },
  windowIndicator: {
    label: '$(gitlab-tanuki) GitLab',
    command: 'khulnasoft-web-ide.open-remote-window',
  },
  defaultLayout: {
    views: [],
    editors: [],
    force: true,
  },
  additionalTrustedDomains: ['gitlab.com', 'about.gitlab.com', 'docs.gitlab.com', 'aka.ms'],
  productConfiguration: {
    // implements Partial<IProductConfiguration> https://gitlab.com/khulnasoft/web-ide-vscode-fork/-/blob/11b6d009a4ec1567b50ba2c0ac5235d5db8ba1e9/src/vs/base/common/product.ts#L33
    // example https://sourcegraph.com/github.com/sourcegraph/openvscode-server@3169b2e0423a56afba4fa1c824f966e7b3b9bf07/-/blob/product.json?L586
    nameShort: 'KhulnaSoft Web IDE',
    nameLong: 'KhulnaSoft Web IDE',
    applicationName: 'khulnasoft-web-ide',
    urlProtocol: 'khulnasoft-web-ide',
    enableTelemetry: false,
    extensionsGallery: undefined,
    licenseName: 'MIT License',
    licenseUrl: 'https://gitlab.com/khulnasoft/web-ide/-/blob/main/LICENSE',
    licenseFileName: 'LICENSE',
    twitterUrl: 'https://twitter.com/gitlab',
    sendASmile: {
      reportIssueUrl: 'https://gitlab.com/gitlab-org/gitlab/-/issues/new?issuable_template=Bug',
      requestFeatureUrl:
        'https://gitlab.com/gitlab-org/gitlab/-/issues/new?issuable_template=Feature%20Proposal%20%2D%20basic',
    },
    reportIssueUrl: 'https://gitlab.com/gitlab-org/gitlab/-/issues/new?issuable_template=Bug',
    requestFeatureUrl:
      'https://gitlab.com/gitlab-org/gitlab/-/issues/new?issuable_template=Feature%20Proposal%20%2D%20basic',
    downloadUrl: '',
    updateUrl: '',
    releaseNotesUrl: 'https://about.gitlab.com/releases/categories/releases/',
    crashReporter: {
      companyName: 'GitLab',
      productName: 'Web IDE',
    },
    keyboardShortcutsUrlMac: '',
    keyboardShortcutsUrlLinux: '',
    keyboardShortcutsUrlWin: '',
    introductoryVideosUrl: '',
    tipsAndTricksUrl: '',
    newsletterSignupUrl: '',
    reportMarketplaceIssueUrl:
      'https://gitlab.com/gitlab-org/gitlab/-/issues/new?issuable_template=Bug',
    privacyStatementUrl: '',
    showTelemetryOptOut: false,
    commit: VSCodeInfo.commit,
    quality: VSCodeInfo.quality,
    trustedExtensionAuthAccess: ['gitlab.gitlab-workflow', WEB_IDE_EXTENSION_ID],
  },
};

const getConfigurationSyncStoreProperties = (config: WebIdeConfig): ConfigurationSyncStore => {
  const settingsContextHash = config.settingsContextHash || '';

  const settingsSyncUrl = joinPaths(
    config.gitlabUrl,
    'api/v4/vscode/settings_sync',
    settingsContextHash,
  );

  return {
    url: settingsSyncUrl,
    insidersUrl: settingsSyncUrl,
    stableUrl: settingsSyncUrl,
    canSwitch: false,
    authenticationProviders: {
      'khulnasoft-web-ide': {
        scopes: ['api'],
      },
    },
  };
};

const startWorkbench = (
  { create }: WorkbenchModule,
  config: WebIdeConfig,
  additionalOptions: Partial<IWorkbenchConstructionOptions>,
) => {
  const additionalTrustedDomains = [
    ...(BASE_OPTIONS.additionalTrustedDomains || []),
    ...(additionalOptions.additionalTrustedDomains || []),
    getDomainFromFullUrl(config.embedderOriginUrl),
    getDomainFromFullUrl(config.workbenchBaseUrl),
  ];
  const documentationUrl = config.links?.documentation || DEFAULT_DOCUMENTATION_URL;
  const webviewContentExternalBaseUrlTemplate = `${config.extensionsHostBaseUrl}/out/vs/workbench/contrib/webview/browser/pre/`;
  const webEndpointUrlTemplate = config.extensionsHostBaseUrl;
  const shouldUseCrossOriginExtensionHost = config.crossOriginExtensionHost;

  const options: IWorkbenchConstructionOptions = {
    ...BASE_OPTIONS,
    ...additionalOptions,
    productConfiguration: {
      ...BASE_OPTIONS.productConfiguration,
      ...additionalOptions.productConfiguration,
      extensionsGallery: isExtensionsMarketplaceEnabled(config)
        ? config.extensionMarketplaceSettings?.vscodeSettings
        : undefined,
      webviewContentExternalBaseUrlTemplate,
      // why: Some customers cannot reach out to our self hosted assets. If this
      //      is set, the Web IDE will fail. Let's use a feature flag so that we can
      //      control when this layer of security is actually needed.
      webEndpointUrlTemplate: shouldUseCrossOriginExtensionHost
        ? webEndpointUrlTemplate
        : undefined,
      serverDocumentationUrl: documentationUrl,
      documentationUrl,
    },
    developmentOptions: {
      logLevel: config.vscodeLogLevel || LogLevel.Info,
    },
    additionalTrustedDomains,
  };

  create(document.body, options);
};

const getConfigurationDefaultFontFamily = (editorFont: WebIdeConfig['editorFont']): string => {
  if (!editorFont) return 'monospace';

  const uniqueFamilies = new Set(editorFont.fontFaces.map(({ family }) => family));
  const fontFaceFamilies = Array.from(
    uniqueFamilies,
    family => `'${escapeCssQuotedValue(family)}'`,
  );

  return `${fontFaceFamilies.join(', ')}, ${editorFont.fallbackFontFamily}`;
};

const getConfigurationDefaults = (config: WebIdeExtensionConfig) => ({
  'workbench.colorTheme': 'KhulnaSoft Dark',
  'gitlab.duoCodeSuggestions.enabled': config.codeSuggestionsEnabled,
  'gitlab.featureFlags.languageServerWebIDE': config.featureFlags?.languageServerWebIDE,
  'editor.fontFamily': getConfigurationDefaultFontFamily(config.editorFont),
  // Disables the command center UI because key features like search don't work in the Web IDE
  'window.commandCenter': false,
  // Disables the layout control panel
  'workbench.layoutControl.enabled': false,
});

export const start = (config: WebIdeExtensionConfig) =>
  new Promise<void>((resolve, reject) => {
    define(
      amdModuleName('start'),
      [MODULE_WORKBENCH_MAIN],
      async (workbenchModule: WorkbenchModule) => {
        try {
          const windowChannel = new DefaultCrossWindowChannel({
            localWindow: window,
            remoteWindow: window.parent,
            remoteWindowOrigin: new URL(config.embedderOriginUrl).origin,
          });
          const messagePortsController = new MessagePortsController({ windowChannel });
          const authProvider = await getAuthProvider({
            config,
            windowChannel,
            onTokenChange: () => messagePortsController.onTokenChange(),
          });

          await cleanWebIdeExtensions(config);

          startWorkbench(workbenchModule, config, {
            additionalTrustedDomains: [getDomainFromFullUrl(config.gitlabUrl)],
            // what: Flag the khulnasoft-web-ide extension as an environment extension which cannot be disabled
            // https://gitlab.com/khulnasoft/web-ide/-/issues/13#note_1053126388
            // https://gitlab.com/khulnasoft/web-ide-vscode-fork/-/blob/fa3eb589de07ab4db0500c32519ce41940c11241/src/vs/workbench/browser/web.api.ts#L215
            enabledExtensions: [WEB_IDE_EXTENSION_ID],
            // TODO - Maybe we want this...
            welcomeBanner: undefined,
            configurationDefaults: getConfigurationDefaults(config),
            secretStorageProvider: createDefaultSecretStorageProvider({
              config,
              authProvider,
            }),

            // This is needed so that we don't enter multiple workspace zone :|
            workspaceProvider: {
              workspace: {
                folderUri: workbenchModule.URI.parse(`khulnasoft-web-ide:///${config.repoRoot}`),
              },
              trusted: true,
              async open() {
                return false;
              },
            },
            productConfiguration: {
              'configurationSync.store': authProvider
                ? getConfigurationSyncStoreProperties(config)
                : undefined,
            },
            messagePorts: messagePortsController.messagePorts,
            // why: Settings sync depends on authProvider being set up
            // https://gitlab.com/khulnasoft/web-ide/-/issues/327
            settingsSyncOptions: authProvider ? SETTINGS_SYNC_OPTIONS : undefined,
          });

          // We already handle onbeforeunload so prevent vscode from doing this
          window.addEventListener('beforeunload', e => {
            e.stopImmediatePropagation();
          });

          resolve();
        } catch (e) {
          reject(e);
        }
      },
    );
  });
