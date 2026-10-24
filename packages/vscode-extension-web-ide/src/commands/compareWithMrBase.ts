import { basename } from '@khulnasoft/utils-path';
import * as vscode from 'vscode';
import { FS_SCHEME, MR_SCHEME } from '../constants';

const getDefaultUri = (): vscode.Uri | undefined => vscode.window.activeTextEditor?.document.uri;

/**
 * Command handler that opens a vscode.diff (MR base vs. File System) of the given URI path
 *
 * **Note:** This commands is contributed to the explorer context menu,
 * which determines the type of arguments provided.
 *
 * @param uriArg - The URI which contains the "path" to use. If not provided, this will default to the active editor's URI.
 * @param allUris - All URI's selected by the explorer context (required by explorer context menu commands).
 * @param options - Options used when opening the diff.
 */
export default async function compareWithMrBase(
  uriArg?: vscode.Uri,
  allUris?: vscode.Uri[],
  { preview = true } = {},
) {
  const uri = uriArg || getDefaultUri();

  if (!uri) {
    // noop
    return;
  }

  const { path } = uri;

  await vscode.commands.executeCommand(
    'vscode.diff',
    vscode.Uri.from({ scheme: MR_SCHEME, path }),
    vscode.Uri.from({ scheme: FS_SCHEME, path }),
    basename(path),
    { preview },
  );
}
