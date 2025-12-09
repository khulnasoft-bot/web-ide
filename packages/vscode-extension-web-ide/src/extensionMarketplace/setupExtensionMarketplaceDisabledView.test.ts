import * as vscode from 'vscode';
import { createFakePartial, createWebIdeExtensionConfig } from '@khulnasoft/utils-test';
import type {
  ExtensionMarketplaceSettings,
  WebIdeExtensionConfig,
} from '@khulnasoft/web-ide-types';
import { setupExtensionMarketplaceDisabledView } from './setupExtensionMarketplaceDisabledView';
import {
  MARKETPLACE_DISABLED_CONTEXT_ID,
  MARKETPLACE_DISABLED_VIEW_DEFAULT,
  MARKETPLACE_DISABLED_VIEW_ENTERPRISE_GROUP,
  MARKETPLACE_DISABLED_VIEW_OPT_IN,
  MARKETPLACE_DISABLED_VIEW_WITH_DOCS,
  GO_TO_ENTERPRISE_GROUP_COMMAND_ID,
  GO_TO_EXTENSION_MARKETPLACE_HELP_COMMAND_ID,
  GO_TO_USER_PREFERENCES_COMMAND_ID,
} from '../constants';

const TEST_HELP_URL = 'https://example.gitlab.com/help/user/project/web_ide/index';
const TEST_PREFERENCES_URL = 'https://example.gitlab.com/-/profile/preferences';
const TEST_ENTERPRISE_GROUP_URL = 'https://example.gitlab.com/groups/test-group';
const TEST_CONFIG: WebIdeExtensionConfig = {
  ...createWebIdeExtensionConfig(),
  crossOriginExtensionHost: true,
};

// note: These are the permutations of possible ExtensionMarketplaceSettings
const TEST_EXTENSION_MARKETPLACE_ENABLED: ExtensionMarketplaceSettings =
  createFakePartial<ExtensionMarketplaceSettings>({ enabled: true });
const TEST_EXTENSION_MARKETPLACE_DISABLED: ExtensionMarketplaceSettings = { enabled: false };
const TEST_EXTENSION_MARKETPLACE_DISABLED_WITH_HELP_URL: ExtensionMarketplaceSettings = {
  enabled: false,
  helpUrl: TEST_HELP_URL,
};
const TEST_EXTENSION_MARKETPLACE_DISABLED_ENTERPRISE_GROUP_DISABLED: ExtensionMarketplaceSettings =
  {
    enabled: false,
    reason: 'enterprise_group_disabled',
    enterpriseGroupName: 'Test Group',
    enterpriseGroupUrl: TEST_ENTERPRISE_GROUP_URL,
    helpUrl: TEST_HELP_URL,
  };
const TEST_EXTENSION_MARKETPLACE_DISABLED_INSTANCE_DISABLED: ExtensionMarketplaceSettings = {
  enabled: false,
  reason: 'instance_disabled',
  helpUrl: TEST_HELP_URL,
};
const TEST_EXTENSION_MARKETPLACE_DISABLED_OPT_IN_UNSET: ExtensionMarketplaceSettings = {
  enabled: false,
  reason: 'opt_in_unset',
  helpUrl: TEST_HELP_URL,
  userPreferencesUrl: TEST_PREFERENCES_URL,
};
const TEST_EXTENSION_MARKETPLACE_DISABLED_OPT_IN_DISABLED: ExtensionMarketplaceSettings = {
  enabled: false,
  reason: 'opt_in_disabled',
  helpUrl: TEST_HELP_URL,
  userPreferencesUrl: TEST_PREFERENCES_URL,
};

describe('extensionMarketplace/setupExtensionMarketplaceDisabledView', () => {
  let result: vscode.Disposable;

  beforeEach(() => {
    jest.mocked(vscode.commands.registerCommand).mockImplementation(() => ({ dispose: jest.fn() }));
  });

  const getContextValue = (): string | undefined =>
    jest
      .mocked(vscode.commands.executeCommand)
      .mock.calls.filter(
        ([commandId, contextId]) =>
          commandId === 'setContext' && contextId === MARKETPLACE_DISABLED_CONTEXT_ID,
      )
      .at(-1)?.[2];

  const getRegisteredCommands = (): string[] =>
    jest.mocked(vscode.commands.registerCommand).mock.calls.map(([commandId]) => commandId);

  const getRegisteredCommandDisposables = (): vscode.Disposable[] =>
    jest.mocked(vscode.commands.registerCommand).mock.results.map(({ value }) => value);

  const getRegisteredCommandDisposablesCalls = () =>
    getRegisteredCommandDisposables().map(
      disposable => jest.mocked(disposable.dispose).mock.calls.length,
    );

  const callCommand = async (commandId: string) => {
    const handler = jest
      .mocked(vscode.commands.registerCommand)
      .mock.calls.find(args => commandId === args[0])?.[1];

    if (handler) {
      await handler();
    }
  };

  describe.each`
    desc                                 | settings                                                         | expectedDisabledView                          | expectedRegisteredCommands
    ${'with enabled'}                    | ${TEST_EXTENSION_MARKETPLACE_ENABLED}                            | ${undefined}                                  | ${[]}
    ${'with undefined'}                  | ${undefined}                                                     | ${MARKETPLACE_DISABLED_VIEW_DEFAULT}          | ${[]}
    ${'with disabled'}                   | ${TEST_EXTENSION_MARKETPLACE_DISABLED}                           | ${MARKETPLACE_DISABLED_VIEW_DEFAULT}          | ${[]}
    ${'with disabled with url'}          | ${TEST_EXTENSION_MARKETPLACE_DISABLED_WITH_HELP_URL}             | ${MARKETPLACE_DISABLED_VIEW_WITH_DOCS}        | ${[GO_TO_EXTENSION_MARKETPLACE_HELP_COMMAND_ID]}
    ${'with disabled instance with url'} | ${TEST_EXTENSION_MARKETPLACE_DISABLED_INSTANCE_DISABLED}         | ${MARKETPLACE_DISABLED_VIEW_WITH_DOCS}        | ${[GO_TO_EXTENSION_MARKETPLACE_HELP_COMMAND_ID]}
    ${'with unset opt in'}               | ${TEST_EXTENSION_MARKETPLACE_DISABLED_OPT_IN_UNSET}              | ${MARKETPLACE_DISABLED_VIEW_OPT_IN}           | ${[GO_TO_EXTENSION_MARKETPLACE_HELP_COMMAND_ID, GO_TO_USER_PREFERENCES_COMMAND_ID]}
    ${'with disabled opt in'}            | ${TEST_EXTENSION_MARKETPLACE_DISABLED_OPT_IN_DISABLED}           | ${MARKETPLACE_DISABLED_VIEW_OPT_IN}           | ${[GO_TO_EXTENSION_MARKETPLACE_HELP_COMMAND_ID, GO_TO_USER_PREFERENCES_COMMAND_ID]}
    ${'with disabled enterprise group'}  | ${TEST_EXTENSION_MARKETPLACE_DISABLED_ENTERPRISE_GROUP_DISABLED} | ${MARKETPLACE_DISABLED_VIEW_ENTERPRISE_GROUP} | ${[GO_TO_EXTENSION_MARKETPLACE_HELP_COMMAND_ID, GO_TO_ENTERPRISE_GROUP_COMMAND_ID]}
  `(
    '$desc ExtensionMarketplaceSettings',
    ({ settings, expectedDisabledView, expectedRegisteredCommands }) => {
      beforeEach(async () => {
        result = await setupExtensionMarketplaceDisabledView({
          ...TEST_CONFIG,
          extensionMarketplaceSettings: settings,
        });
      });

      it('registers expected context', () => {
        expect(getContextValue()).toBe(expectedDisabledView);
      });

      it('registers expected commands', () => {
        expect(getRegisteredCommands()).toEqual(expectedRegisteredCommands);
      });
    },
  );

  describe('when crossOriginExtensionHost is disabled', () => {
    beforeEach(async () => {
      result = await setupExtensionMarketplaceDisabledView({
        ...TEST_CONFIG,
        crossOriginExtensionHost: false,
        extensionMarketplaceSettings: TEST_EXTENSION_MARKETPLACE_ENABLED,
      });
    });

    it('displays default disabled view', () => {
      expect(getContextValue()).toBe(MARKETPLACE_DISABLED_VIEW_DEFAULT);
    });
  });

  describe('with disabled opt in ExtensionMarketplaceSettings', () => {
    beforeEach(async () => {
      result = await setupExtensionMarketplaceDisabledView({
        ...TEST_CONFIG,
        extensionMarketplaceSettings: TEST_EXTENSION_MARKETPLACE_DISABLED_OPT_IN_DISABLED,
      });
    });

    it('when result is disposed, disposes registered commands', () => {
      expect(getRegisteredCommandDisposablesCalls()).toEqual([0, 0]);

      result.dispose();

      expect(getRegisteredCommandDisposablesCalls()).toEqual([1, 1]);
    });

    it.each`
      commandId                                      | expectedUrl
      ${GO_TO_EXTENSION_MARKETPLACE_HELP_COMMAND_ID} | ${TEST_HELP_URL}
      ${GO_TO_USER_PREFERENCES_COMMAND_ID}           | ${TEST_PREFERENCES_URL}
    `('when command is called $commandId', async ({ commandId, expectedUrl }) => {
      expect(vscode.env.openExternal).not.toHaveBeenCalled();

      await callCommand(commandId);

      expect(vscode.env.openExternal).toHaveBeenCalledWith(vscode.Uri.parse(expectedUrl));
    });
  });

  describe('with disabled enterprise group ExtensionMarketplaceSettings', () => {
    beforeEach(async () => {
      result = await setupExtensionMarketplaceDisabledView({
        ...TEST_CONFIG,
        extensionMarketplaceSettings: TEST_EXTENSION_MARKETPLACE_DISABLED_ENTERPRISE_GROUP_DISABLED,
      });
    });

    it('when go to enterprise group command is called', async () => {
      expect(vscode.env.openExternal).not.toHaveBeenCalled();

      await callCommand(GO_TO_ENTERPRISE_GROUP_COMMAND_ID);

      expect(vscode.env.openExternal).toHaveBeenCalledWith(
        vscode.Uri.parse(TEST_ENTERPRISE_GROUP_URL),
      );
    });
  });
});
