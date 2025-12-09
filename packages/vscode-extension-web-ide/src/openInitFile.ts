import { joinPaths, PATH_ROOT } from '@khulnasoft/utils-path';
import * as vscode from 'vscode';
import { FS_SCHEME, VSCODE_COMMAND_KEEP_EDITOR } from './constants';
import { getConfig } from './mediator';
import { touchFile, tryStat } from './utils/fs';
import { log } from './utils';

export async function openInitFile() {
  const config = await getConfig();

  if (!config.filePath || config.filePath === PATH_ROOT) {
    return;
  }

  const { fs } = vscode.workspace;
  const uri = vscode.Uri.from({
    scheme: FS_SCHEME,
    path: joinPaths('/', config.repoRoot, config.filePath),
  });
  const stat = await tryStat(fs, uri);

  if (stat && stat.type === vscode.FileType.Directory) {
    // TODO: Handle init opening a directory...
    return;
  }

  if (!stat && !fs.isWritableFileSystem(FS_SCHEME)) {
    log.debug(
      '[khulnasoft-web-ide] File was not found and user lacks permission to create: ',
      config.filePath,
    );

    return;
  }

  if (!stat) {
    await touchFile(vscode.workspace.fs, uri);
  }

  // In case the welcome view was opened, let's keep it open (related to "enablePreview")
  await vscode.commands.executeCommand(VSCODE_COMMAND_KEEP_EDITOR);

  await vscode.window.showTextDocument(uri);
}
