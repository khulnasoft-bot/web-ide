import type Stats from 'browserfs/dist/node/core/node_fs_stats';
import type { FileStats } from '../../types';
import { FileType } from '../../types';

/**
 * Converts the given BrowserFS Stats to our own FileType
 *
 * @param stat BFS Stats
 * @returns
 */
export const convertToFileType = (stat: Stats): FileType => {
  if (stat.isDirectory()) {
    return FileType.Tree;
  }
  return FileType.Blob;
};

/**
 * Converts the given BrowserFS Stats to our own FileStats
 *
 * @param stat BFS Stats
 * @returns
 */
export const convertToFileStats = (stat: Stats): FileStats => ({
  ctime: stat.ctime.getTime(),
  mtime: stat.mtime.getTime(),
  size: stat.size,
  mode: stat.mode,
  type: convertToFileType(stat),
});
