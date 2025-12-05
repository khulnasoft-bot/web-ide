import * as vscode from 'vscode';
import * as redhatVscodeYaml from './redhatVscodeYaml';

export function setupExtension<T>(
  extensionId: string,
  setupFn: (extension?: vscode.Extension<T>) => void,
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];
  let currentExtension = vscode.extensions.getExtension(extensionId);

  if (currentExtension) {
    setupFn(currentExtension);
  }

  const disposeOnChange = vscode.extensions.onDidChange(() => {
    const nextExtension = vscode.extensions.getExtension(extensionId);
    const hasBeenInstalled = Boolean(nextExtension && !currentExtension);

    currentExtension = nextExtension;

    if (hasBeenInstalled) {
      setupFn(currentExtension);
    }
  });

  disposables.push(disposeOnChange);
  return disposables;
}

export function setupThirdPartyExtensions(context: vscode.ExtensionContext) {
  return context.subscriptions.push(
    ...setupExtension<redhatVscodeYaml.VscodeYamlExtensionApi>(
      redhatVscodeYaml.EXTENSION_ID,
      redhatVscodeYaml.setup,
    ),
  );
}
