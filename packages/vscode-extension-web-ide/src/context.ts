import type * as vscode from 'vscode';

let extensionContext: undefined | vscode.ExtensionContext;

export const initExtensionContext = (val: vscode.ExtensionContext) => {
  // why: This should only ever be called once and if it's called more than once,
  //      something really wrong is happening. In tests just mock getExtensionContext.
  if (extensionContext) {
    throw new Error('Extension context already initialized');
  }

  extensionContext = val;
};

export const getExtensionContext = (): vscode.ExtensionContext => {
  if (!extensionContext) {
    throw new Error('Extension context not initialized');
  }

  return extensionContext;
};
