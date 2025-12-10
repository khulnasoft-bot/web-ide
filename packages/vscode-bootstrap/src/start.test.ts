import type { WebIdeConfig, VscodeExtensionsGallerySettings } from '@khulnasoft/web-ide-types';
import { getAuthProvider } from '@khulnasoft/khulnasoft-api-client-factory';
import webIdeExtensionMeta from '@khulnasoft/vscode-extension-web-ide/vscode.package.json';
import { createCommands } from '@khulnasoft/vscode-mediator-commands';
import {
  createFakeCrossWindowChannel,
  createFakePartial,
  createWebIdeExtensionConfig,
  useFakeMessageChannel,
} from '@khulnasoft/utils-test';
import vscodeVersion from '@khulnasoft/vscode-build/vscode_version.json';
import { NOOP_AUTH_PROVIDER } from '@khulnasoft/khulnasoft-api-client';
import { DefaultCrossWindowChannel } from '@khulnasoft/cross-origin-channel';
import { useMockAMDEnvironment } from '../test-utils/amd';
import { start } from './start';
import type {
  ISecretStorageProvider,
  IWorkbenchConstructionOptions,
  WorkbenchModule,
} from './vscode';
import { createDefaultSecretStorageProvider } from './vscode';
import { cleanWebIdeExtensions } from './cleanExtensions';

const WEB_IDE_EXTENSION_TEST_CONFIG = createWebIdeExtensionConfig();
const TEST_MEDIATOR_COMMANDS = [{ id: 'command', handler: jest.fn() }];
const TEST_AUTH_PROVIDER = NOOP_AUTH_PROVIDER;
const TEST_SECRET_STORAGE_PROVIDER = createFakePartial<ISecretStorageProvider>({});
const TEST_VSCODE_EXTENSION_SETTINGS: VscodeExtensionsGallerySettings = {
  controlUrl: 'test-control-url',
  itemUrl: 'test-item-url',
  nlsBaseUrl: 'test-nls-url',
  publisherUrl: 'test-publisher-url',
  resourceUrlTemplate: 'test-resource-url-template',
  serviceUrl: 'test-service-url',
};

const TEST_SETTINGS_SYNC_OPTIONS = {
  enabled: true,
  extensionsSyncStateVersion: '1.0.0',
  authenticationProvider: expect.objectContaining({
    id: 'khulnasoft-web-ide',
  }),
};
const TEST_SETTINGS_CONTEXT_HASH = '1234';

jest.mock('@khulnasoft/cross-origin-channel');
jest.mock('@khulnasoft/vscode-mediator-commands');
jest.mock('@khulnasoft/khulnasoft-api-client-factory');
jest.mock('./vscode/secrets/factory');
jest.mock('./cleanExtensions');

describe('vscode-bootstrap start', () => {
  useFakeMessageChannel();

  const amd = useMockAMDEnvironment();

  const workbenchDisposeSpy = jest.fn();
  const workbenchModule = {
    create: jest.fn(),
    URI: {
      // TODO: Chad "This is weird"
      parse: (x: string) => `URI.parse-${x}`,
      from: (x: Record<string, string>) => `URI.from-${x.scheme}-${x.path}-${x.authority}}`,
    },
    logger: {
      log: jest.fn(),
    },
  };
  let mockCrossWindowChannel: DefaultCrossWindowChannel;

  beforeAll(() => {
    amd.shim();
  });

  beforeEach(() => {
    // We have to do spy setup like mockReturnValue in a `beforeEach`. Otherwise
    // Jest will clear it out after the first run.
    workbenchModule.create.mockReturnValue({ dispose: workbenchDisposeSpy });

    amd.define<WorkbenchModule>('vs/workbench/workbench.web.main', () => workbenchModule);

    jest.mocked(createCommands).mockReturnValue(Promise.resolve(TEST_MEDIATOR_COMMANDS));
    jest.mocked(getAuthProvider).mockResolvedValue(TEST_AUTH_PROVIDER);
    jest.mocked(createDefaultSecretStorageProvider).mockReturnValue(TEST_SECRET_STORAGE_PROVIDER);

    mockCrossWindowChannel = createFakeCrossWindowChannel();

    jest.mocked(DefaultCrossWindowChannel).mockReturnValueOnce(mockCrossWindowChannel);

    window.parent = createFakePartial<Window>({});
  });

  afterEach(() => {
    amd.cleanup();
  });

  describe('start', () => {
    let subject: IWorkbenchConstructionOptions;

    const callStart = async (partialConfig: Partial<WebIdeConfig> = {}) => {
      await start({
        ...WEB_IDE_EXTENSION_TEST_CONFIG,
        ...partialConfig,
      });

      expect(workbenchModule.create).toHaveBeenCalledTimes(1);

      [[, subject]] = workbenchModule.create.mock.calls;
    };

    describe('with basic configuration', () => {
      beforeEach(async () => {
        await callStart();
      });

      it('creates workbench on body', () => {
        expect(workbenchModule.create).toHaveBeenCalledWith(document.body, subject);
      });

      it('creates workbench with enabledExtensions', () => {
        const { publisher, name } = webIdeExtensionMeta;

        expect(subject).toMatchObject({
          enabledExtensions: [`${publisher}.${name}`],
        });
      });

      it('creates a workbench with a custom windowIndicator', () => {
        expect(subject).toMatchObject({
          windowIndicator: {
            label: '$(gitlab-tanuki) GitLab',
            command: 'khulnasoft-web-ide.open-remote-window',
          },
        });
      });

      it('creates workbench with trusted domains', () => {
        expect(subject).toMatchObject({
          additionalTrustedDomains: [
            'gitlab.com',
            'about.gitlab.com',
            'docs.gitlab.com',
            'aka.ms',
            'gitlab.com',
            'foo.bar',
            'ide.foo.bar',
          ],
        });
      });

      it('creates workbench with secret storage provider', () => {
        expect(createDefaultSecretStorageProvider).toHaveBeenCalledWith({
          config: WEB_IDE_EXTENSION_TEST_CONFIG,
          authProvider: TEST_AUTH_PROVIDER,
        });

        expect(subject.secretStorageProvider).toBe(TEST_SECRET_STORAGE_PROVIDER);
      });

      it('has default layout', () => {
        expect(subject).toMatchObject({
          defaultLayout: {
            force: true,
            editors: [],
          },
        });
      });

      it('sets commit to same as vscode_version.json', () => {
        expect(subject.productConfiguration?.commit).toBe(vscodeVersion.commit);
        expect(subject.productConfiguration?.quality).toBe(vscodeVersion.quality);
      });

      it('sets the default configuration for font family', () => {
        expect(subject.configurationDefaults?.['editor.fontFamily']).toBe('monospace');
      });

      it('does not create mediator commands', () => {
        expect(createCommands).not.toHaveBeenCalled();
        expect(subject.commands).toBeUndefined();
      });

      it('creates auth provider with config', () => {
        expect(getAuthProvider).toHaveBeenCalledTimes(1);
        expect(getAuthProvider).toHaveBeenCalledWith({
          config: WEB_IDE_EXTENSION_TEST_CONFIG,
          windowChannel: mockCrossWindowChannel,
          onTokenChange: expect.any(Function),
        });
      });

      it('creates a WindowChannel instance', async () => {
        expect(DefaultCrossWindowChannel).toHaveBeenLastCalledWith({
          localWindow: window,
          remoteWindow: window.parent,
          remoteWindowOrigin: new URL(WEB_IDE_EXTENSION_TEST_CONFIG.embedderOriginUrl).origin,
        });
      });

      it('calls cleanExtensions function', () => {
        expect(cleanWebIdeExtensions).toHaveBeenCalledWith(WEB_IDE_EXTENSION_TEST_CONFIG);
      });

      it('has settingsSyncOptions', () => {
        expect(subject.settingsSyncOptions).toEqual(TEST_SETTINGS_SYNC_OPTIONS);
      });

      it('has onTokenChange tied to the messagePorts', () => {
        const spy = jest.fn();

        subject.messagePorts
          ?.get('gitlab.khulnasoft-web-ide')
          ?.addEventListener('message', e => spy(e.data));
        const { onTokenChange } = jest.mocked(getAuthProvider).mock.calls[0][0];

        if (!onTokenChange) {
          throw new Error('onTokenChange is not defined');
        }

        onTokenChange();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith('webide_auth_change');
      });

      it('has productConfiguration for configurationSync.store', () => {
        expect(subject.productConfiguration?.['configurationSync.store']).toEqual({
          authenticationProviders: {
            'khulnasoft-web-ide': {
              scopes: ['api'],
            },
          },
          canSwitch: false,
          insidersUrl: 'https://gitlab.com/api/v4/vscode/settings_sync',
          stableUrl: 'https://gitlab.com/api/v4/vscode/settings_sync',
          url: 'https://gitlab.com/api/v4/vscode/settings_sync',
        });
      });
    });
    describe('with configured fonts', () => {
      beforeEach(async () => {
        await start({
          ...WEB_IDE_EXTENSION_TEST_CONFIG,
          editorFont: {
            fallbackFontFamily: 'monospace',
            fontFaces: [
              {
                family: 'KhulnaSoft Mono',
                src: [
                  {
                    url: '/GitLabMono.woff2',
                    format: 'woff2',
                  },
                ],
              },
              {
                family: 'KhulnaSoft Mono',
                style: 'italic',
                src: [
                  {
                    url: '/GitLabMonoItalic.woff2',
                    format: 'woff2',
                  },
                ],
              },
            ],
          },
        });

        expect(workbenchModule.create).toHaveBeenCalledTimes(1);

        [[, subject]] = workbenchModule.create.mock.calls;
      });

      it('sets the default configuration for font family', () => {
        expect(subject.configurationDefaults?.['editor.fontFamily']).toBe(
          "'KhulnaSoft Mono', monospace",
        );
      });
    });

    describe('with crossOriginExtensionHost', () => {
      beforeEach(async () => {
        await callStart({ crossOriginExtensionHost: true });
      });

      it('sets webEndpointUrlTemplate', () => {
        expect(subject.productConfiguration?.webEndpointUrlTemplate).toBe(
          'https://{{uuid}}.cdn.web-ide.gitlab-static.net/web-ide-vscode/{{quality}}/{{commit}}',
        );
      });
    });

    describe('with extensionMarketplaceSettings disabled and crossOriginExtensionHost enabled', () => {
      beforeEach(async () => {
        await callStart({
          extensionMarketplaceSettings: { enabled: false },
          crossOriginExtensionHost: true,
        });
      });

      it('sets webEndpointUrlTemplate', () => {
        expect(subject.productConfiguration?.webEndpointUrlTemplate).toBe(
          'https://{{uuid}}.cdn.web-ide.gitlab-static.net/web-ide-vscode/{{quality}}/{{commit}}',
        );
      });

      it('does not set extensionsGallery', () => {
        expect(subject.productConfiguration?.extensionsGallery).toBeUndefined();
      });
    });

    describe('with crossOriginExtensionHost enabled and extensionMarketplaceSettings enabled', () => {
      beforeEach(async () => {
        await callStart({
          extensionMarketplaceSettings: {
            enabled: true,
            vscodeSettings: TEST_VSCODE_EXTENSION_SETTINGS,
          },
          crossOriginExtensionHost: true,
          settingsContextHash: TEST_SETTINGS_CONTEXT_HASH,
        });
      });

      it('sets extensionsGallery', () => {
        expect(subject.productConfiguration?.extensionsGallery).toBe(
          TEST_VSCODE_EXTENSION_SETTINGS,
        );
      });
    });

    describe('with crossOriginExtensionHost disabled and extensionMarketplaceSettings enabled', () => {
      beforeEach(async () => {
        await callStart({
          extensionMarketplaceSettings: {
            enabled: true,
            vscodeSettings: TEST_VSCODE_EXTENSION_SETTINGS,
          },
          crossOriginExtensionHost: false,
          settingsContextHash: TEST_SETTINGS_CONTEXT_HASH,
        });
      });

      it('does not set extensionsGallery', () => {
        expect(subject.productConfiguration?.extensionsGallery).toBe(undefined);
      });
    });

    describe('with configurationSync.store', () => {
      it.each`
        label             | settingsContextHash           | expectedSettingsSyncUrl
        ${'provided'}     | ${TEST_SETTINGS_CONTEXT_HASH} | ${`https://gitlab.com/api/v4/vscode/settings_sync/${TEST_SETTINGS_CONTEXT_HASH}`}
        ${'not provided'} | ${undefined}                  | ${'https://gitlab.com/api/v4/vscode/settings_sync'}
      `(
        'it returns correct settings sync URLs if settingsContextHash is $label',
        async ({ settingsContextHash, expectedSettingsSyncUrl }) => {
          await callStart({
            extensionMarketplaceSettings: {
              enabled: true,
              vscodeSettings: TEST_VSCODE_EXTENSION_SETTINGS,
            },
            settingsContextHash,
          });

          expect(subject.productConfiguration?.['configurationSync.store']).toEqual({
            authenticationProviders: {
              'khulnasoft-web-ide': {
                scopes: ['api'],
              },
            },
            canSwitch: false,
            insidersUrl: expectedSettingsSyncUrl,
            stableUrl: expectedSettingsSyncUrl,
            url: expectedSettingsSyncUrl,
          });
        },
      );
    });
  });
});
