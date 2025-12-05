import type * as vscode from 'vscode';

export const tryStat = async (fs: vscode.FileSystem, uri: vscode.Uri) =>
  fs.stat(uri).then(
    x => x,
    () => null,
  );
