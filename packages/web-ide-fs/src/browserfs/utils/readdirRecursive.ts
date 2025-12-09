import { joinPaths } from '@khulnasoft/utils-path';
import type { ReadonlyPromisifiedBrowserFS } from '../types';

export const readdirRecursive = async (
  fs: ReadonlyPromisifiedBrowserFS,
  path: string,
): Promise<string[]> => {
  const children = await fs.readdir(path);

  const childrenResults = await Promise.all(
    children.map(async child => {
      const childPath = joinPaths(path, child);
      const stat = await fs.stat(childPath, false);

      if (stat.isDirectory()) {
        return readdirRecursive(fs, childPath);
      }

      return [childPath];
    }),
  );

  return childrenResults.flatMap(x => x);
};
