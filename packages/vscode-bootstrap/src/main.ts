// initialized by loading SCRIPT_VSCODE_LOADER 'vscode/out/vs/loader.js'
import { type WebIdeConfig, type SerializableConfig, ErrorType } from '@khulnasoft/web-ide-types';
import type { WebIDEConfigResponseMessage } from '@gitlab/cross-origin-channel';
import { DefaultCrossWindowChannel } from '@gitlab/cross-origin-channel';
import { insertScript } from './utils/insertScript';
import { insertMeta } from './utils/insertMeta';
import { getRepoRoot } from './utils/getRepoRoot';
import { loadGitLabFonts } from './utils/loadGitLabFonts';
import { handleEmbedderChange } from './handleEmbedderChange';
import { configRequire } from './amd/configRequire';

const SCRIPT_VSCODE_AMD_LOADER = 'vscode/out/vs/loader.js';
const SCRIPT_VSCODE_WORKBENCH_NLS = 'vscode/out/nls.messages.js';
const SCRIPT_VSCODE_WORKBENCH = 'vscode/out/vs/workbench/workbench.web.main.js';

declare global {
  interface Window {
    // initialized by loading SCRIPT_VSCODE_LOADER
    trustedTypes: {
      createPolicy(...args: unknown[]): unknown;
    };
  }
}

const getExtensionConfig = async (config: WebIdeConfig, extensionPath: string) => {
  const extensionPackageJSONUrl = `${config.workbenchBaseUrl}/vscode/extensions/${extensionPath}/package.json`;
  const rawJson = await fetch(extensionPackageJSONUrl).then(x => x.text());
  const packageJSON = JSON.parse(rawJson);

  return {
    extensionPath,
    packageJSON,
  };
};

const getBuiltInExtensions = async (config: SerializableConfig) =>
  Promise.all([
    getExtensionConfig(config, 'khulnasoft-web-ide'),
    getExtensionConfig(config, 'gitlab-language-support-vue'),
    getExtensionConfig(config, 'khulnasoft-vscode-extension'),
    getExtensionConfig(config, 'khulnasoft-vscode-theme'),
  ]);

/**
 * This makes sure that the navigator keyboard is compatible
 *
 * VSCode reads from this global sometimes and was throwing some errors... This might not be needed...
 */
const setupNavigatorKeyboard = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((navigator as any).keyboard) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.assign((navigator as any).keyboard, {
      getLayoutMap: () => Promise.resolve(new Map()),
    });
  }
};

const setupAMDRequire = async (config: WebIdeConfig) => {
  await insertScript(`${config.workbenchBaseUrl}/${SCRIPT_VSCODE_AMD_LOADER}`, config.nonce);

  const vscodeUrl = `${config.workbenchBaseUrl}/vscode`;

  configRequire({
    baseUrl: `${vscodeUrl}/out`,
    recordStats: true,
    trustedTypesPolicy: window.trustedTypes?.createPolicy('amdLoader', {
      createScriptURL(value: string) {
        if (value.startsWith(vscodeUrl)) {
          return value;
        }
        throw new Error(`Invalid script url: ${value}`);
      },
    }),
  });
};

export const main = async () => {
  const windowChannel = new DefaultCrossWindowChannel({
    localWindow: window,
    remoteWindow: window.parent,
    remoteWindowOrigin: '*',
  });

  try {
    windowChannel.postMessage({ key: 'web-ide-config-request' });

    const initWorkbenchMessage = await handleEmbedderChange(
      await windowChannel.waitForMessage<WebIDEConfigResponseMessage>('web-ide-config-response'),
    );
    const config: WebIdeConfig = JSON.parse(initWorkbenchMessage.params.config);

    await fetch(`${config.gitlabUrl}/api/graphql`, {
      mode: 'cors',
      method: 'POST',
    });

    windowChannel.postMessage({ key: 'web-ide-cors-success-response' });

    loadGitLabFonts(config.editorFont?.fontFaces);

    const extensionList = await getBuiltInExtensions(config);

    insertMeta('gitlab-builtin-vscode-extensions', extensionList);

    setupNavigatorKeyboard();

    await setupAMDRequire(config);

    await Promise.all([
      insertScript(`${config.workbenchBaseUrl}/${SCRIPT_VSCODE_WORKBENCH_NLS}`, config.nonce),
      insertScript(`${config.workbenchBaseUrl}/${SCRIPT_VSCODE_WORKBENCH}`, config.nonce),
    ]);

    const { start } = await import('./start');

    if (config) {
      await start({
        ...config,
        repoRoot: getRepoRoot(config.projectPath),
      });
    } else {
      // This shouldn't happen.
      throw new Error(`Unexpected config (${config}) when trying to start VSCode.`);
    }

    windowChannel.postMessage({ key: 'ready' });
  } catch (e) {
    windowChannel.postMessage({
      key: 'error',
      params: { errorType: ErrorType.START_WORKBENCH_FAILED, details: (e as Error).message },
    });
  }
};
