import { createDefaultOverlayFS, REPO_ROOT } from '../../../test-utils/fs';
import type { ReadonlyPromisifiedBrowserFS } from '../types';
import { existsAsFile } from './existsAsFile';

describe('browserfs/utils/existsAsFile', () => {
  let fs: ReadonlyPromisifiedBrowserFS;

  beforeEach(async () => {
    ({ readable: fs } = await createDefaultOverlayFS());
  });

  describe.each`
    path                                 | expectedExists | expectedExistsAsFile
    ${`/${REPO_ROOT}/README.md`}         | ${true}        | ${true}
    ${`/${REPO_ROOT}/foo/bar`}           | ${true}        | ${false}
    ${`/${REPO_ROOT}/foo/not-a-file.md`} | ${false}       | ${false}
  `('for "$path"', ({ path, expectedExists, expectedExistsAsFile }) => {
    it(`exists=${expectedExists}`, async () => {
      await expect(fs.exists(path)).resolves.toBe(expectedExists);
    });

    it(`existsAsFile=${expectedExistsAsFile}`, async () => {
      await expect(existsAsFile(path, fs)).resolves.toBe(expectedExistsAsFile);
    });
  });
});
