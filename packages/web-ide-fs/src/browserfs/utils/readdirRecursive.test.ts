import { ApiError } from 'browserfs/dist/node/core/api_error';
import { REPO_ROOT, createDefaultOverlayFS } from '../../../test-utils/fs';
import type { ReadonlyPromisifiedBrowserFS } from '../types';
import { readdirRecursive } from './readdirRecursive';

describe('browserfs/utils/readdirRecursive', () => {
  let fs: ReadonlyPromisifiedBrowserFS;

  beforeEach(async () => {
    ({ readable: fs } = await createDefaultOverlayFS());
  });

  it('returns all blobs under path', async () => {
    const result = await readdirRecursive(fs, `/${REPO_ROOT}/foo`);

    expect(result).toEqual([`/${REPO_ROOT}/foo/bar/index.js`, `/${REPO_ROOT}/foo/README.md`]);
  });

  it('throws when path is not found', async () => {
    await expect(readdirRecursive(fs, 'not-a-real-path')).rejects.toEqual(
      ApiError.ENOENT('not-a-real-path'),
    );
  });
});
