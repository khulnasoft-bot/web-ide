import * as vscode from 'vscode';
import { createFakePartial } from '@khulnasoft/utils-test';

import { setupThirdPartyExtensions } from '.';
import * as redhatVscodeYaml from './redhatVscodeYaml';

jest.mock('./redhatVscodeYaml');

describe('setupThirdPartyExtensions', () => {
  let extensions: vscode.Extension<unknown>[];
  let extensionContext: vscode.ExtensionContext;

  const createMockExtension = (extensionId: string) => ({
    id: extensionId,
    name: 'Test Extension',
    extensionKind: vscode.ExtensionKind.Workspace,
    exports: '',
    activate: jest.fn(),
    extensionUri: vscode.Uri.parse('https://example.com'),
    extensionPath: '',
    isActive: true,
    packageJSON: {},
  });

  const triggerExtensionsChange = () => {
    jest.mocked(vscode.extensions.onDidChange).mock.calls.forEach(([listener]) => {
      listener();
    });
  };

  beforeEach(() => {
    extensions = [createMockExtension('gitlab.bogus')];
    extensionContext = createFakePartial<vscode.ExtensionContext>({
      subscriptions: [],
    });

    jest
      .mocked(vscode.extensions.getExtension)
      .mockImplementation(extensionId => extensions.find(x => x.id === extensionId));
  });

  describe('default', () => {
    beforeEach(() => {
      setupThirdPartyExtensions(extensionContext);
    });

    it('does not call redhat yaml setup', () => {
      expect(redhatVscodeYaml.setup).not.toHaveBeenCalled();
    });

    it('after unrelated change, does not call redhat yaml setup', () => {
      triggerExtensionsChange();

      expect(redhatVscodeYaml.setup).not.toHaveBeenCalled();
    });

    it('when installed the uninstalled, only calls setup on install', () => {
      extensions.push(createMockExtension('redhat.vscode-yaml'));
      triggerExtensionsChange();
      expect(redhatVscodeYaml.setup).toHaveBeenCalledTimes(1);
      expect(redhatVscodeYaml.setup).toHaveBeenCalledWith(extensions[1]);

      jest.mocked(redhatVscodeYaml.setup).mockClear();
      extensions = [];
      triggerExtensionsChange();
      expect(redhatVscodeYaml.setup).not.toHaveBeenCalled();
    });
  });

  describe('when installed', () => {
    beforeEach(() => {
      extensions.push(createMockExtension('redhat.vscode-yaml'));

      setupThirdPartyExtensions(extensionContext);
    });

    it('calls the `vscode-yaml` extension setup function', () => {
      expect(redhatVscodeYaml.setup).toHaveBeenCalledTimes(1);
      expect(redhatVscodeYaml.setup).toHaveBeenCalledWith(extensions[1]);
    });

    it('when uninstalled then reinstalled, calls setup', () => {
      jest.mocked(redhatVscodeYaml.setup).mockClear();

      // Uninstalled
      extensions = [];
      triggerExtensionsChange();
      expect(redhatVscodeYaml.setup).not.toHaveBeenCalled();

      // Installed
      extensions.push(createMockExtension('redhat.vscode-yaml'));
      triggerExtensionsChange();
      expect(redhatVscodeYaml.setup).toHaveBeenCalledTimes(1);
      expect(redhatVscodeYaml.setup).toHaveBeenCalledWith(extensions[0]);
    });
  });
});
