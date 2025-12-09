import * as vscode from 'vscode';
import { basename } from '@khulnasoft/utils-path';
import type { FileStatus } from '@khulnasoft/web-ide-fs';
import { FileStatusType } from '@khulnasoft/web-ide-fs';
import { fromPathToScmUri, fromUriToScmUri } from './uri';
import { FS_SCHEME } from '../constants';
import type { StatusViewModel } from './types';

const openCommand = (uri: vscode.Uri, openTitle: string): vscode.Command => ({
  command: 'vscode.open',
  title: 'Open',
  arguments: [uri, {}, openTitle],
});

const diffCommand = (
  leftUri: vscode.Uri,
  rightUri: vscode.Uri,
  openTitle: string,
): vscode.Command => ({
  command: 'vscode.diff',
  title: 'Open',
  arguments: [leftUri, rightUri, openTitle],
});

export const toResourceState = (statusVm: StatusViewModel): vscode.SourceControlResourceState => ({
  resourceUri: statusVm.uri,
  command: statusVm.command,
  decorations: {
    faded: false,
    strikeThrough: statusVm.decorations.strikethrough,
    tooltip: statusVm.decorations.tooltip,
  },
});

export const toFileDecoration = (statusVm: StatusViewModel): vscode.FileDecoration => {
  const decoration = new vscode.FileDecoration(
    statusVm.decorations.letter,
    statusVm.decorations.tooltip,
    statusVm.decorations.color,
  );

  decoration.propagate = statusVm.decorations.propagate;

  return decoration;
};

export const createStatusViewModel = (status: FileStatus, repoRoot: string): StatusViewModel => {
  const name = basename(status.path);
  const uri = fromPathToScmUri(status.path, repoRoot);

  switch (status.type) {
    case FileStatusType.Created:
      return {
        uri,
        command: openCommand(uri.with({ scheme: FS_SCHEME }), `${name} (Changed)`),
        decorations: {
          tooltip: 'Created',
          letter: 'A',
          color: new vscode.ThemeColor('webIde.addedResourceForeground'),
          strikethrough: false,
          propagate: true,
        },
      };
    case FileStatusType.Deleted:
      return {
        uri,
        command: openCommand(fromUriToScmUri(uri, 'HEAD'), `${name} (Deleted)`),
        decorations: {
          tooltip: 'Deleted',
          letter: 'D',
          color: new vscode.ThemeColor('webIde.deletedResourceForeground'),
          strikethrough: true,
          propagate: false,
        },
      };
    case FileStatusType.Modified:
      return {
        uri,
        command: diffCommand(
          fromUriToScmUri(uri, 'HEAD'),
          uri.with({ scheme: FS_SCHEME }),
          `${name} (Changed)`,
        ),
        decorations: {
          tooltip: 'Modified',
          letter: 'M',
          color: new vscode.ThemeColor('webIde.modifiedResourceForeground'),
          strikethrough: false,
          propagate: true,
        },
      };
    default:
      throw new Error('This should never happen!');
  }
};
