import * as vscode from 'vscode';
import type { WebIdeExtensionConfig, ExtensionMarketplaceSettings } from '@gitlab/web-ide-types';
import {
  GO_TO_EXTENSION_MARKETPLACE_HELP_COMMAND_ID,
  GO_TO_USER_PREFERENCES_COMMAND_ID,
  GO_TO_ENTERPRISE_GROUP_COMMAND_ID,
  MARKETPLACE_DISABLED_CONTEXT_ID,
  MARKETPLACE_DISABLED_VIEW_OPT_IN,
  MARKETPLACE_DISABLED_VIEW_WITH_DOCS,
  MARKETPLACE_DISABLED_VIEW_DEFAULT,
  MARKETPLACE_DISABLED_VIEW_ENTERPRISE_GROUP,
} from '../constants';
import { NOOP_DISPOSABLE } from '../utils';

interface ViewModel {
  disabledView?: string;

  commands?: {
    id: string;
    url: string;
  }[];
}

const getExtensionMarketplaceStatusViewModel = (params: {
  crossOriginExtensionHost: boolean;
  extensionMarketplaceSettings: ExtensionMarketplaceSettings | undefined;
}): ViewModel => {
  const { crossOriginExtensionHost, extensionMarketplaceSettings } = params;

  if (!crossOriginExtensionHost || !extensionMarketplaceSettings) {
    return {
      disabledView: MARKETPLACE_DISABLED_VIEW_DEFAULT,
    };
  }

  if (extensionMarketplaceSettings.enabled) {
    return {};
  }

  const commands: { id: string; url: string }[] = [];

  if (extensionMarketplaceSettings.helpUrl) {
    commands.push({
      id: GO_TO_EXTENSION_MARKETPLACE_HELP_COMMAND_ID,
      url: extensionMarketplaceSettings.helpUrl,
    });
  }

  if (extensionMarketplaceSettings.reason === 'enterprise_group_disabled') {
    commands.push({
      id: GO_TO_ENTERPRISE_GROUP_COMMAND_ID,
      url: extensionMarketplaceSettings.enterpriseGroupUrl,
    });

    return {
      disabledView: MARKETPLACE_DISABLED_VIEW_ENTERPRISE_GROUP,
      commands,
    };
  }

  if (
    extensionMarketplaceSettings.reason === 'opt_in_disabled' ||
    extensionMarketplaceSettings.reason === 'opt_in_unset'
  ) {
    commands.push({
      id: GO_TO_USER_PREFERENCES_COMMAND_ID,
      url: extensionMarketplaceSettings.userPreferencesUrl,
    });

    return {
      disabledView: MARKETPLACE_DISABLED_VIEW_OPT_IN,
      commands,
    };
  }

  if (extensionMarketplaceSettings.helpUrl) {
    return {
      disabledView: MARKETPLACE_DISABLED_VIEW_WITH_DOCS,
      commands,
    };
  }

  return {
    disabledView: MARKETPLACE_DISABLED_VIEW_DEFAULT,
    commands,
  };
};

export const setupExtensionMarketplaceDisabledView = async (config: WebIdeExtensionConfig) => {
  const model = getExtensionMarketplaceStatusViewModel({
    crossOriginExtensionHost: Boolean(config.crossOriginExtensionHost),
    extensionMarketplaceSettings: config.extensionMarketplaceSettings,
  });

  if (model.disabledView) {
    await vscode.commands.executeCommand(
      'setContext',
      MARKETPLACE_DISABLED_CONTEXT_ID,
      model.disabledView,
    );
  }

  if (!model.commands?.length) {
    return NOOP_DISPOSABLE;
  }

  const disposables = model.commands.map(({ id, url }) =>
    vscode.commands.registerCommand(id, () => vscode.env.openExternal(vscode.Uri.parse(url))),
  );

  return vscode.Disposable.from(...disposables);
};
