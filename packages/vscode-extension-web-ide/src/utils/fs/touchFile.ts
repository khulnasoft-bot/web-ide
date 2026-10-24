import type * as vscode from 'vscode';
import { splitParent } from '@khulnasoft/utils-path';
import { tryStat } from './tryStat';

export const touchFile = async (fs: vscode.FileSystem, uri: vscode.Uri): Promise<void> => {
  const stat = await tryStat(fs, uri);

  // If we already exist, there's nothing to do
  if (stat) {
    return;
  }

  const [parentPath] = splitParent(uri.path);

  if (parentPath) {
    await fs.createDirectory(uri.with({ path: parentPath }));
  }

  await fs.writeFile(uri, new Uint8Array(0));
};
