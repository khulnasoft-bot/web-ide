import { dirname, PATH_ROOT } from '@khulnasoft/utils-path';
import type { PromisifiedBrowserFS } from '../types';

export const mkdirp = async (fs: PromisifiedBrowserFS, path: string, mode = 0): Promise<void> => {
  if (await fs.exists(path)) {
    return;
  }

  const parentPath = dirname(path);

  if (parentPath !== path && parentPath !== PATH_ROOT) {
    await mkdirp(fs, parentPath);
  }

  await fs.mkdir(path, mode);
};
