import { ErrorCode } from 'browserfs/dist/node/core/api_error';
import type { ReadonlyPromisifiedBrowserFS } from '../types';

export const readdirOrEmpty = async (
  fs: ReadonlyPromisifiedBrowserFS,
  p: string,
): Promise<string[]> => {
  try {
    return await fs.readdir(p);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e?.errno === ErrorCode.ENOENT) {
      return [];
    }

    throw e;
  }
};
