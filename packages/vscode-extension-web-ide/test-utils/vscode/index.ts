import * as vscode from 'vscode';

export const createFakeCancellationToken = (): vscode.CancellationToken => ({
  isCancellationRequested: false,
  onCancellationRequested: jest.fn(),
});

export const createFakeProgress = (): vscode.Progress<{ increment: number; message: string }> => ({
  report: jest.fn(),
});

export const createFakeGlobalState = (): vscode.Memento => {
  const internal = new Map();

  const store: vscode.Memento = {
    get: jest.fn().mockImplementation((key: string) => internal.get(key)),
    keys: jest.fn().mockImplementation(() => internal.keys()),
    update: jest.fn().mockImplementation((key, value) => internal.set(key, value)),
  };

  return store;
};

export const createFakeExtensionContext = (): vscode.ExtensionContext => {
  return {} as unknown as vscode.ExtensionContext;
};

export const createFakeFileStat = (
  type: vscode.FileType = vscode.FileType.File,
): vscode.FileStat => ({
  ctime: 0,
  mtime: 0,
  size: 0,
  type,
});
