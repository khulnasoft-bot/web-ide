import { FileFlag } from 'browserfs/dist/node/core/file_flag';
import type { ReadonlyPromisifiedBrowserFS } from '../types';
import { readdirRecursive } from './readdirRecursive';

/**
 * Returns object of all blobs found in `fs` under `path`
 * with the blob path as keys and corresponding content as the value.
 */
export const readAllFiles = async (
  fs: ReadonlyPromisifiedBrowserFS,
  path = '/',
): Promise<Record<string, Buffer>> => {
  const allChildren = await readdirRecursive(fs, path);

  const allChildrenWithContent = await Promise.all(
    allChildren.map(async (childPath): Promise<[string, Buffer]> => {
      // We know it's a Buffer because we do not pass encoding
      const content = <Buffer>await fs.readFile(childPath, null, FileFlag.getFileFlag('r'));

      return [childPath, content];
    }),
  );

  return Object.fromEntries(allChildrenWithContent);
};
