import type {
  CrossWindowChannel,
  ErrorMessage,
  WindowChannelMessage,
} from '@gitlab/cross-origin-channel';
import type {
  WebIdeConfig,
  WebIde,
  OAuthCallbackConfig,
  Disposable,
} from '@khulnasoft/web-ide-types';
import { DefaultCrossWindowChannel } from '@gitlab/cross-origin-channel';
import { createOAuthClient } from '@gitlab/oauth-client';
import { defaultLogger } from '@gitlab/logger';
import { checkOAuthToken } from './checkOAuthToken';
import type { UnloadPreventer } from './unloadPreventer';
import { createUnloadPreventer } from './unloadPreventer';
import { AuthPortChannelController } from './AuthPortChannelController';
import { handleSetHrefMessage } from './handleSetHrefMessage';
import { handleOpenUriMessage } from './handleOpenUriMessage';
import { WEB_IDE_WORKBENCH_PING_IFRAME_ID, WEB_IDE_WORKBENCH_PING_TIMEOUT } from './constants';

export const createError = (msg: string) => new Error(`[gitlab-vscode] ${msg}`);

interface HandleMessagesOptions {
  windowChannel: CrossWindowChannel;
  config: WebIdeConfig;
  unloadPreventer: UnloadPreventer;
}

const handleMessages = ({ windowChannel, config, unloadPreventer }: HandleMessagesOptions) =>
  windowChannel.addMessagesListener((e: WindowChannelMessage) => {
    switch (e.key) {
      case 'error':
        config.handleError?.(e.params.errorType);
        break;
      case 'web-ide-tracking':
        config.handleTracking?.(e.params.event);
        break;
      case 'prevent-unload':
        unloadPreventer.setShouldPrevent(e.params.shouldPrevent);
        break;
      case 'update-web-ide-context':
        config.handleContextUpdate?.(e.params);
        break;
      case 'open-uri':
        handleOpenUriMessage(config, e);
        break;
      case 'set-href':
        handleSetHrefMessage(e);
        break;
      default:
        break;
    }
  });

const bootstrapWorkbench = async (
  windowChannel: CrossWindowChannel,
  config: WebIdeConfig,
): Promise<void> => {
  try {
    await windowChannel.waitForMessage('web-ide-config-request');

    windowChannel.postMessage({
      key: 'web-ide-config-response',
      params: {
        config: JSON.stringify(config),
      },
    });

    await Promise.race([
      windowChannel.waitForMessage('ready'),
      windowChannel.waitForMessage<ErrorMessage>('error').then(({ params }) => {
        throw new Error(`${params.errorType}: ${params.details}`);
      }),
    ]);

    /**
     * We interpret further Web IDE config requests as the result
     * of the iframe window that hosts the Web IDE being reloaded.
     * We want to react to this event by reloading the main window as well.
     */
    windowChannel.addMessageListener('web-ide-config-request', () => {
      window.location.reload();
    });
  } catch (e) {
    defaultLogger.error(e);
    throw new Error(e?.toString());
  }
};

const buildWebIDEWorkbenchUrl = (config: WebIdeConfig) =>
  `${config.workbenchBaseUrl}/assets/workbench.html`;

const startAnyConfig = (el: Element, config: WebIdeConfig): WebIde => {
  const unloadPreventer = createUnloadPreventer();
  const iframe = document.createElement('iframe');

  Object.assign(iframe.style, {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
    border: 'none',
    margin: 0,
    padding: 0,
  });
  iframe.setAttribute(
    'allow',
    `clipboard-read; clipboard-write; usb; serial; hid; cross-origin-isolated; autoplay;`,
  );
  iframe.setAttribute('data-testid', 'web-ide-iframe');

  el.appendChild(iframe);

  if (!iframe.contentWindow) {
    throw createError('Could not find contentWindow for iframe.');
  }

  const windowChannel = new DefaultCrossWindowChannel({
    localWindow: window,
    remoteWindow: iframe.contentWindow,
    remoteWindowOrigin: new URL(config.workbenchBaseUrl).origin,
  });

  const disposables: Disposable[] = [
    windowChannel,
    unloadPreventer,
    handleMessages({ windowChannel, config, unloadPreventer }),
  ];

  if (config.auth.type === 'oauth') {
    const oauthClient = createOAuthClient({
      oauthConfig: config.auth,
      gitlabUrl: config.gitlabUrl,
      owner: config.username,
    });

    const authPortController = new AuthPortChannelController({
      oauthClient,
      authPort: windowChannel.createLocalPortChannel('auth-port'),
    });

    disposables.push(authPortController);
  }

  const ready = bootstrapWorkbench(windowChannel, config);

  iframe.src = buildWebIDEWorkbenchUrl(config);

  return {
    dispose() {
      iframe.remove();
      disposables.forEach(disposable => disposable.dispose());
    },
    ready,
  };
};

export const start = async (el: Element, configArg: WebIdeConfig): Promise<WebIde> => {
  const config: WebIdeConfig = {
    ...configArg,
    /**
     * TODO: Remove this deprecated `extensionsGallerySettings` support once
     * the Rails app has been updated.
     * https://gitlab.com/gitlab-org/gitlab/-/issues/512642
     */
    extensionMarketplaceSettings:
      configArg.extensionMarketplaceSettings || configArg.extensionsGallerySettings,
    /**
     * TODO: Remove these fallback values once the embedderOriginUrl,
     * workbenchBaseUrl, and the extensionsHostBaseUrl are provided
     * by the GitLab Rails application.
     */
    embedderOriginUrl: configArg.embedderOriginUrl || configArg.baseUrl || '',
    workbenchBaseUrl: configArg.workbenchBaseUrl || configArg.baseUrl || '',
    extensionsHostBaseUrl:
      configArg.extensionsHostBaseUrl ||
      'https://{{uuid}}.cdn.web-ide.gitlab-static.net/web-ide-vscode/{{quality}}/{{commit}}',
  };

  await checkOAuthToken(config);

  return startAnyConfig(el, config);
};

export const pingWorkbench = async ({
  el,
  config,
  timeout = WEB_IDE_WORKBENCH_PING_TIMEOUT,
}: {
  el: Element;
  config: WebIdeConfig;
  timeout?: number;
}): Promise<void> => {
  const iframe = document.createElement('iframe');

  iframe.setAttribute('id', WEB_IDE_WORKBENCH_PING_IFRAME_ID);
  iframe.style.display = 'none';

  el.appendChild(iframe);

  if (!iframe.contentWindow) {
    throw createError('Could not find contentWindow for iframe.');
  }

  const windowChannel = new DefaultCrossWindowChannel({
    localWindow: window,
    remoteWindow: iframe.contentWindow,
    remoteWindowOrigin: new URL(config.workbenchBaseUrl).origin,
  });

  try {
    const waitForConfigPromise = windowChannel.waitForMessage('web-ide-config-request', timeout);

    iframe.src = buildWebIDEWorkbenchUrl(config);

    await waitForConfigPromise;

    windowChannel.postMessage({
      key: 'web-ide-config-response',
      params: { config: JSON.stringify(config) },
    });

    await Promise.race([
      windowChannel.waitForMessage('web-ide-cors-success-response', timeout),
      windowChannel.waitForMessage<ErrorMessage>('error').then(({ params }) => {
        throw new Error(`${params.errorType}: ${params.details}`);
      }),
    ]);
  } finally {
    iframe.remove();
  }
};

export const oauthCallback = async (config: OAuthCallbackConfig) => {
  if (config.auth.type !== 'oauth') {
    throw new Error('Expected config.auth to be OAuth config.');
  }

  const oauthClient = createOAuthClient({
    oauthConfig: config.auth,
    gitlabUrl: config.gitlabUrl,
    owner: config.username,
  });

  return oauthClient.handleCallback();
};
