import { DefaultFileList } from './FileList';
import { FakeFileContentProvider } from '../test-utils/FakeFileContentProvider';
import { DEFAULT_FILES, DEFAULT_FILE_ARRAY, REPO_ROOT } from '../test-utils/fs';
import { createSystems } from './create';
import type { FileList, FileSystem } from './types';

const INIT_BLOBS = DEFAULT_FILE_ARRAY.map(x => x.path);

describe('FileListWithCache', () => {
  let fs: FileSystem;
  let fileList: DefaultFileList;
  let subject: FileList;

  describe('default', () => {
    beforeEach(async () => {
      const systems = await createSystems({
        contentProvider: new FakeFileContentProvider(DEFAULT_FILES),
        gitLsTree: DEFAULT_FILE_ARRAY,
        repoRoot: REPO_ROOT,
      });
      ({ fs } = systems);

      fileList = new DefaultFileList({
        sourceControl: systems.sourceControl,
        initBlobs: INIT_BLOBS,
      });
      subject = fileList.withCache(fs);
    });

    describe('listAllBlobs', () => {
      it('returns result from base fileList', async () => {
        const actual = await subject.listAllBlobs();
        const expected = await fileList.listAllBlobs();

        expect(actual).toEqual(expected);
      });

      it('returns result when file system lastModifiedTime is -1', async () => {
        jest.spyOn(fs, 'lastModifiedTime').mockResolvedValue(-1);

        const actual = await subject.listAllBlobs();
        const expected = await fileList.listAllBlobs();

        expect(actual).toEqual(expected);
      });

      it('caches', async () => {
        jest.spyOn(fileList, 'listAllBlobs');

        const original = await subject.listAllBlobs();
        const final = await subject.listAllBlobs();

        expect(fileList.listAllBlobs).toHaveBeenCalledTimes(1);
        expect(original).toBe(final);
      });

      it.each`
        desc           | act
        ${'writeFile'} | ${() => fs.writeFile(`/${REPO_ROOT}/README.md`, new TextEncoder().encode('TEST'))}
        ${'rm'}        | ${() => fs.rm(`/${REPO_ROOT}/README.md`, { recursive: true })}
      `('invalidates cache when $desc', async ({ act }: { act: () => Promise<void> }) => {
        jest.spyOn(fileList, 'listAllBlobs');

        await subject.listAllBlobs();

        await act();

        // Time to invalidate with a fs update!
        await subject.listAllBlobs();

        expect(fileList.listAllBlobs).toHaveBeenCalledTimes(2);
      });
    });
  });
});
