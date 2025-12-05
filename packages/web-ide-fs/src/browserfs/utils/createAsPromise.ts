import type { BFSCallback } from 'browserfs/dist/node/core/file_system';

type BrowserFSFactory<T, TOpt> = (options: TOpt, cb: BFSCallback<T>) => void;

/**
 * Promisifies BrowserFSFactory
 */
export const createAsPromise = async <T, TOpt>(
  createFn: BrowserFSFactory<T, TOpt>,
  opt: TOpt,
): Promise<T> =>
  new Promise((resolve, reject) => {
    createFn(opt, (e, value) => {
      if (e) {
        reject(e);
      } else if (value) {
        resolve(value);
      }
    });
  });
