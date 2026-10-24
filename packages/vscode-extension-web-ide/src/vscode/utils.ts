import type { FileStat } from 'vscode';
import { FileType } from 'vscode';
import type { FileStats } from '@khulnasoft/web-ide-fs';
import { FileType as WebIdeFileType } from '@khulnasoft/web-ide-fs';

export const toVSCodeFileType = (type: WebIdeFileType): FileType => {
  switch (type) {
    case WebIdeFileType.Blob:
      return FileType.File;
    case WebIdeFileType.Tree:
      return FileType.Directory;
    default:
      return FileType.Unknown;
  }
};

export const toVSCodeFileStat = (entry: FileStats): FileStat => ({
  ...entry,
  type: toVSCodeFileType(entry.type),
});
