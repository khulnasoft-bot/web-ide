import type { ReadonlyPromisifiedBrowserFS } from '../types';

/**
 * Returns true if-and-only-if the path exists **and** is a file
 */
export const existsAsFile = async (
  fullPath: string,
  fs: ReadonlyPromisifiedBrowserFS,
): Promise<boolean> => {
  try {
    const stat = await fs.stat(fullPath, null);

    return stat.isFile();
  } catch {
    return false;
  }
};
