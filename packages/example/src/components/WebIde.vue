<script lang="ts">
import { AuthConfig, WebIdeConfig, ExtensionMarketplaceSettings } from '@khulnasoft/web-ide-types';
import * as webIde from '@khulnasoft/web-ide';
import { defineComponent, onMounted, PropType, ref } from 'vue';
import type { ContextUpdatePayload, TrackingEvent } from '@khulnasoft/web-ide-types';
import type { ExampleConfig } from '../types';
import {
  getRootUrlFromLocation,
  getOAuthCallbackUrl,
  getExtensionsHostBaseUrl,
  getWorkbenchBaseUrl,
  getEmbedderOriginUrl,
  getSettingsContextHash,
} from '../config';
import { joinPaths } from '@khulnasoft/utils-path';

const getAuthConfigFromExample = ({
  authType,
  gitlabToken,
  clientId,
}: ExampleConfig): AuthConfig => {
  if (authType === 'token') {
    return {
      type: 'token',
      token: gitlabToken,
    };
  }

  return {
    type: 'oauth',
    clientId,
    callbackUrl: getOAuthCallbackUrl(),
    // why: Let's use regular refreshToken since we can't silently reauth in the example app
    protectRefreshToken: false,
  };
};

const getExtensionMarketplaceSettings = ({
  extensionMarketplaceEnabled,
  gitlabUrl,
  extensionMarketplaceDisabledReason: reason,
}: ExampleConfig): ExtensionMarketplaceSettings | undefined => {
  if (extensionMarketplaceEnabled) {
    return {
      enabled: true,
      vscodeSettings: {
        itemUrl: 'https://open-vsx.org/vscode/item',
        serviceUrl: 'https://open-vsx.org/vscode/gallery',
        resourceUrlTemplate:
          'https://open-vsx.org/vscode/unpkg/{publisher}/{name}/{versionRaw}/{path}',
        controlUrl: '',
        nlsBaseUrl: '',
        publisherUrl: '',
      },
    };
  }

  const helpUrl = joinPaths(gitlabUrl, '/help/user/project/web_ide/index');
  if (reason === 'instance_disabled') {
    return {
      enabled: false,
      reason,
      helpUrl,
    };
  }

  if (reason === 'opt_in_disabled' || reason === 'opt_in_unset') {
    return {
      enabled: false,
      reason,
      helpUrl,
      userPreferencesUrl: joinPaths(gitlabUrl, '/-/profile/preferences'),
    };
  }

  if (reason === 'enterprise_group_disabled') {
    return {
      enabled: false,
      reason,
      helpUrl,
      enterpriseGroupName: 'Test Enterprise Group',
      enterpriseGroupUrl: joinPaths(gitlabUrl, '/test-enterprise-group'),
    };
  }

  return undefined;
};

const getConfigFromExample = async (exampleConfig: ExampleConfig) => {
  const {
    gitlabUrl,
    projectPath,
    gitRef: ref,
    codeSuggestionsEnabled,
    telemetryEnabled,
  } = exampleConfig;

  const url = new URL(window.location.href);

  const extensionMarketplaceSettings = getExtensionMarketplaceSettings(exampleConfig);
  const settingsContextHash =
    exampleConfig.settingsContextHash ||
    (await getSettingsContextHash(extensionMarketplaceSettings));

  return {
    gitlabUrl,
    projectPath,
    codeSuggestionsEnabled,
    telemetryEnabled,
    ref: url.searchParams.get('ref') || ref,
    auth: getAuthConfigFromExample(exampleConfig),
    extensionMarketplaceSettings: extensionMarketplaceSettings,
    settingsContextHash,
    featureFlags: {
      languageServerWebIDE: exampleConfig.languageServerEnabled,
      additionalSourceControlOperations: true,
    },
    filePath: url.searchParams.get('filePath') || '',
    mrId: url.searchParams.get('mrId') || '',
    mrTargetProject: url.searchParams.get('mrTargetProject') || '',
    // Used to test what `forkInfo` we might receive from the main KhulnaSoft project.
    // See ../../web-ide-types/src/config.ts for more comments on `forkInfo`.
    forkInfo: {
      ide_path: url.searchParams.get('forkInfo.ide_path') || undefined,
      fork_path: url.searchParams.get('forkInfo.fork_path') || undefined,
    },
    username: url.searchParams.get('username') || '',
  };
};

const start = async (el: Element, config: WebIdeConfig) => {
  const { ready } = await webIde.start(el, {
    ...config,
  });

  ready.then(() => {
    console.log('[web-ide-example-app] Web IDE ready!');
  });
};

export default defineComponent({
  props: {
    config: {
      type: Object as PropType<ExampleConfig>,
      required: true,
    },
  },
  setup(props) {
    const container = ref<Element>();

    onMounted(async () => {
      if (!container.value) {
        return;
      }

      const handleError = () => {
        // TODO: Handle workbench creation failure
        window.location.reload();
      };
      const handleTracking = (event: TrackingEvent) => {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(event, null, 2));
      };

      const handleContextUpdate = ({ ref, projectPath }: ContextUpdatePayload) => {
        console.log('WEB IDE context updated', { projectPath, ref });

        window.location.search = new URLSearchParams({
          projectPath,
          ref,
          autostart: 'true',
        }).toString();
      };

      const userConfig = await getConfigFromExample(props.config);
      start(container.value, {
        extensionsHostBaseUrl: getExtensionsHostBaseUrl(),
        workbenchBaseUrl: getWorkbenchBaseUrl(),
        embedderOriginUrl: getEmbedderOriginUrl(),
        crossOriginExtensionHost: true,
        handleError,
        handleTracking,
        handleContextUpdate, // TODO: Remove this once we have a better way to handle context updates
        links: {
          feedbackIssue: 'https://gitlab.com/groups/gitlab-org/-/epics/8880',
          userPreferences: 'https://gitlab.com/-/profile/preferences',
          signIn: 'https://gitlab.com/users/sign_in',
        },
        editorFont: {
          fallbackFontFamily: 'monospace',
          fontFaces: [
            {
              family: 'KhulnaSoft Mono',
              display: 'block',
              src: [
                {
                  url: `${getRootUrlFromLocation()}/fonts/GitLabMono.woff2`,
                  format: 'woff2',
                },
              ],
            },
            {
              family: 'KhulnaSoft Mono',
              style: 'italic',
              display: 'block',
              src: [
                {
                  url: `${getRootUrlFromLocation()}/fonts/GitLabMono-Italic.woff2`,
                  format: 'woff2',
                },
              ],
            },
          ],
        },
        ...userConfig,
      });
    });
    return {
      container,
    };
  },
});
</script>

<template>
  <div ref="container" />
</template>
