import { ApiError } from 'browserfs/dist/node/core/api_error';
import {
  DEFAULT_FILES,
  REPO_ROOT,
  stringToBuffer,
  createDefaultOverlayFS,
} from '../../../test-utils/fs';
import type { ReadonlyPromisifiedBrowserFS } from '../types';
import { readAllFiles } from './readAllFiles';

describe('browserfs/utils/readAllFiles', () => {
  let fs: ReadonlyPromisifiedBrowserFS;

  beforeEach(async () => {
    ({ readable: fs } = await createDefaultOverlayFS());
  });

  it('returns an object of all blob paths as keys and content as values', async () => {
    const result = await readAllFiles(fs, `/${REPO_ROOT}/foo`);

    expect(result).toEqual({
      [`/${REPO_ROOT}/foo/bar/index.js`]: stringToBuffer(DEFAULT_FILES['foo/bar/index.js']),
      [`/${REPO_ROOT}/foo/README.md`]: stringToBuffer(DEFAULT_FILES['foo/README.md']),
    });
  });

  it('throws when path is not found', async () => {
    await expect(readAllFiles(fs, 'not-a-real-path')).rejects.toEqual(
      ApiError.ENOENT('not-a-real-path'),
    );
  });
});
