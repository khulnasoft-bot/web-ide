import { basename } from '@gitlab/utils-path';
import type { FileStatus } from '@gitlab/web-ide-fs';

export const generateCommitMessage = (status: FileStatus[]) => {
  const count = status.length;

  // why: This shouldn't ever happen, but just in case...
  if (count === 0) {
    return 'Empty commit';
  }
  if (count === 1) {
    return `Update file ${basename(status[0].path)}`;
  }

  return `Update ${count} files

${status.map(x => `- ${x.path}`).join('\n')}`;
};
