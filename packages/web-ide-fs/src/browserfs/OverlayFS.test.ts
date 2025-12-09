import { dirname } from '@khulnasoft/utils-path';
import { ApiError, ErrorCode } from 'browserfs/dist/node/core/api_error';
import { FileFlag } from 'browserfs/dist/node/core/file_flag';
import { REPO_ROOT, DEFAULT_FILES, DEFAULT_FILE_ARRAY, bfsUtils } from '../../test-utils/fs';
import { FakeFileContentProvider } from '../../test-utils';
import { createAsPromise } from './utils';
import { createOverlayFS, createOverlayFSComponents } from './create';
import type { PromisifiedBrowserFS, ReadonlyPromisifiedBrowserFS } from './types';
import OverlayFS from './OverlayFS';
import { OverlayFSDeletedFilesLog } from './OverlayFSDeletedFilesLog';
import { MODE_DEFAULT } from '../constants';

const DELETED_FILES_LOG_PATH = '/.deletedFiles.log';

// why: We have constants for `TEST_FILE` and `TEST_FILE_PATH`.
//      The `bfsUtils` test helpers add the REPO_ROOT automatically
//      while interacting with the FileSystem directory won't do this.
//      It helps the readability of the tests to have both.
const TEST_FILE = 'README.md';
const TEST_FILE_RENAMED = 'README_NEW.md';
const TEST_FILE_2 = 'foo/bar/index.js';
const TEST_FILE_PATH = `/${REPO_ROOT}/${TEST_FILE}`;
const TEST_FILE_RENAMED_PATH = `/${REPO_ROOT}/${TEST_FILE_RENAMED}`;
const TEST_FILE_2_PATH = `/${REPO_ROOT}/${TEST_FILE_2}`;
const TEST_NEW_DIR = '/newdir';
const TEST_NEW_CONTENT = 'Lorem ipsum dolar sit!\n';

// note: We can wrap the OverlayFS with FileSystemPromiseAdapter
//       to comfortably test both OverlayFS and the underlying
//       OverlayFSImpl.
//
//       See also `./create.test.ts` which has more integration-esque
//       tests which cover OverlayFS behavior.
describe('browserfs/OverlayFS', () => {
  let readable: ReadonlyPromisifiedBrowserFS;
  let subject: PromisifiedBrowserFS;

  const getMetaInfo = () => ({
    name: subject.getName(),
    isReadOnly: subject.isReadOnly(),
    supportsLinks: subject.supportsLinks(),
    supportsProps: subject.supportsProps(),
    supportsSynch: subject.supportsSynch(),
  });

  const lsRecursive = () => bfsUtils.readAllFiles(subject, `/${REPO_ROOT}`).then(Object.keys);

  beforeEach(async () => {
    const overlayFSComponents = await createOverlayFSComponents({
      contentProvider: new FakeFileContentProvider(DEFAULT_FILES),
      gitLsTree: DEFAULT_FILE_ARRAY,
      repoRoot: REPO_ROOT,
    });

    subject = await createOverlayFS(overlayFSComponents);

    readable = overlayFSComponents.readable;
  });

  describe('default', () => {
    it('new directory does not exist yet', async () => {
      await expect(readable.exists(TEST_NEW_DIR)).resolves.toBe(false);
      await expect(subject.exists(TEST_NEW_DIR)).resolves.toBe(false);
    });

    it('implements meta interface methods', () => {
      expect(getMetaInfo()).toEqual({
        name: 'LockedFS<OverlayFS>',
        isReadOnly: false,
        supportsLinks: false,
        supportsProps: false,
        supportsSynch: false,
      });
    });

    describe('error handling', () => {
      it.each`
        desc                                                    | act                                                                                                             | expectedError
        ${'mkdir, throws if path is protected'}                 | ${() => subject.mkdir(DELETED_FILES_LOG_PATH, MODE_DEFAULT)}                                                    | ${ApiError.EPERM(DELETED_FILES_LOG_PATH)}
        ${'mkdir, throws if path exists'}                       | ${() => subject.mkdir(TEST_FILE_PATH, MODE_DEFAULT)}                                                            | ${ApiError.EEXIST(TEST_FILE_PATH)}
        ${'readdir, throws if not a directory'}                 | ${() => subject.readdir(TEST_FILE_PATH)}                                                                        | ${ApiError.ENOTDIR(TEST_FILE_PATH)}
        ${'rename, throws if oldPath does not exist'}           | ${() => subject.rename('/dne', '/new_thing')}                                                                   | ${ApiError.ENOENT('/dne')}
        ${'rename, throws if newPath already exists'}           | ${() => subject.rename(TEST_FILE_2_PATH, TEST_FILE_PATH)}                                                       | ${ApiError.EEXIST(TEST_FILE_PATH)}
        ${'rmdir, throws if path does not exist'}               | ${() => subject.rmdir('/dne')}                                                                                  | ${ApiError.ENOENT('/dne')}
        ${'stat, throws if path does not exist'}                | ${() => subject.stat('/dne', false)}                                                                            | ${ApiError.ENOENT('/dne')}
        ${'unlink, throws if path does not exist'}              | ${() => subject.unlink('/dne')}                                                                                 | ${ApiError.ENOENT('/dne')}
        ${'writeFile, throws if path does not exist with "r+"'} | ${() => subject.writeFile('/dne', TEST_NEW_CONTENT, 'utf-8', FileFlag.getFileFlag('r+'), MODE_DEFAULT)}         | ${ApiError.ENOENT('/dne')}
        ${'writeFile, throws if exists with "x"'}               | ${() => subject.writeFile(TEST_FILE_PATH, TEST_NEW_CONTENT, 'utf-8', FileFlag.getFileFlag('wx'), MODE_DEFAULT)} | ${ApiError.EEXIST(TEST_FILE_PATH)}
        ${'utimes, throws (not supported)'}                     | ${() => subject.utimes(TEST_FILE_PATH, new Date(), new Date())}                                                 | ${new ApiError(ErrorCode.ENOTSUP)}
        ${'chmod, throws (not supported)'}                      | ${() => subject.chmod(TEST_FILE_PATH, false, MODE_DEFAULT)}                                                     | ${new ApiError(ErrorCode.ENOTSUP)}
        ${'chown, throws (not supported)'}                      | ${() => subject.chown(TEST_FILE_PATH, false, 7, 7)}                                                             | ${new ApiError(ErrorCode.ENOTSUP)}
      `('$desc', async ({ act, expectedError }) => {
        await expect(act()).rejects.toEqual(expectedError);
      });
    });

    it('readdir, returns directory contents', async () => {
      await expect(subject.readdir(`/${REPO_ROOT}`)).resolves.toEqual(['README.md', 'foo', 'tmp']);
    });

    it('rename, does nothing if paths are the same', async () => {
      await subject.rename(TEST_FILE_PATH, TEST_FILE_PATH);

      await expect(subject.exists(TEST_FILE_PATH)).resolves.toBe(true);
      // Assert that we didn't even try to delete and re-add anything
      await expect(subject.exists(DELETED_FILES_LOG_PATH)).resolves.toBe(false);
    });
  });

  describe('when new directory is added', () => {
    beforeEach(async () => {
      await subject.mkdir(TEST_NEW_DIR, MODE_DEFAULT);
    });

    it('will exist', async () => {
      await expect(subject.exists(TEST_NEW_DIR)).resolves.toBe(true);
      // readable is unchanged
      await expect(readable.exists(TEST_NEW_DIR)).resolves.toBe(false);
    });

    it('will be found in parent directory', async () => {
      await expect(subject.readdir(dirname(TEST_NEW_DIR))).resolves.toEqual(['newdir', REPO_ROOT]);
    });

    it('can be read', async () => {
      await expect(subject.readdir(TEST_NEW_DIR)).resolves.toEqual([]);
    });
  });

  describe('when directory is deleted, then re-added', () => {
    beforeEach(async () => {
      await bfsUtils.rmRepoFile(subject, 'foo');
      await bfsUtils.writeRepoFile(subject, 'foo/newfile.md', TEST_NEW_CONTENT);
    });

    it('has deleted files log', async () => {
      await expect(subject.exists(DELETED_FILES_LOG_PATH)).resolves.toBe(true);
    });

    it('can be read', async () => {
      await expect(subject.readdir(`/${REPO_ROOT}/foo`)).resolves.toEqual(['newfile.md']);
    });
  });

  // why: This tests the `open` and `sync` methods
  describe('when readable file is being appended', () => {
    beforeEach(async () => {
      await subject.appendFile(
        TEST_FILE_2_PATH,
        TEST_NEW_CONTENT,
        'utf-8',
        FileFlag.getFileFlag('a'),
        MODE_DEFAULT,
      );
    });

    it('updates file', async () => {
      await expect(bfsUtils.readRepoFile(subject, TEST_FILE_2)).resolves.toBe(
        `${DEFAULT_FILES[TEST_FILE_2]}${TEST_NEW_CONTENT}`,
      );
    });
  });

  describe('when file is updated and then renamed', () => {
    beforeEach(async () => {
      await bfsUtils.writeRepoFile(subject, TEST_FILE, TEST_NEW_CONTENT);
      await subject.rename(TEST_FILE_PATH, TEST_FILE_RENAMED_PATH);
    });

    it('the old file does not exist', async () => {
      await expect(subject.exists(TEST_FILE_PATH)).resolves.toBe(false);
    });

    it('the old file wont be in the parent directory', async () => {
      await expect(subject.readdir(`/${REPO_ROOT}`)).resolves.toEqual([
        TEST_FILE_RENAMED,
        'foo',
        'tmp',
      ]);
    });

    it('can be read', async () => {
      await expect(bfsUtils.readRepoFile(subject, TEST_FILE_RENAMED)).resolves.toBe(
        TEST_NEW_CONTENT,
      );
    });
  });

  describe('when file is updated and then directory is removed', () => {
    beforeEach(async () => {
      await bfsUtils.writeRepoFile(subject, TEST_FILE_2, TEST_NEW_CONTENT);
      // TODO: Create a rmrf util
      await bfsUtils.rmRepoFile(subject, TEST_FILE_2);
      await bfsUtils.rmRepoFile(subject, 'foo/bar');
      await bfsUtils.rmRepoFile(subject, 'foo');
    });

    it('file and directory should not exist', async () => {
      await expect(subject.exists(TEST_FILE_2_PATH)).resolves.toBe(false);
      await expect(subject.exists(`/${REPO_ROOT}/foo`)).resolves.toBe(false);
    });
  });

  describe('when child is deleted and parent directory renamed', () => {
    beforeEach(async () => {
      await bfsUtils.rmRepoFile(subject, TEST_FILE_2);
      await subject.rename(`/${REPO_ROOT}/foo`, `/${REPO_ROOT}/src`);
    });

    it('old file should not exist', async () => {
      await expect(subject.exists(TEST_FILE_2)).resolves.toBe(false);
    });

    it('old file should not exist in new directory', async () => {
      const newDirectoryPath = TEST_FILE_2.replace(`/${REPO_ROOT}/foo`, `/${REPO_ROOT}/src`);

      await expect(subject.exists(newDirectoryPath)).resolves.toBe(false);
    });

    it('old directory does not show up in readdir', async () => {
      await expect(subject.readdir(`/${REPO_ROOT}`)).resolves.toEqual(['src', 'README.md', 'tmp']);
      await expect(subject.readdir(`/${REPO_ROOT}/src`)).resolves.toEqual(['bar', 'README.md']);
      await expect(subject.readdir(`/${REPO_ROOT}/src/bar`)).resolves.toEqual([]);
    });
  });

  describe('when created with readonly writable system', () => {
    it('throws error', async () => {
      const notARealWritable = readable as PromisifiedBrowserFS;

      await expect(
        createAsPromise(OverlayFS.Create, {
          readable,
          // This will trigger the error
          writable: notARealWritable,
          deletedFilesLog: new OverlayFSDeletedFilesLog(notARealWritable),
        }),
      ).rejects.toEqual(expect.objectContaining({ errno: ErrorCode.EINVAL }));
    });
  });

  describe('when directory is moved into another directory', () => {
    beforeEach(async () => {
      await subject.rename(`/${REPO_ROOT}/tmp`, `/${REPO_ROOT}/foo/tmp`);
    });

    it('moves into new directory', async () => {
      await expect(subject.exists(`/${REPO_ROOT}/tmp`)).resolves.toBe(false);
      await expect(lsRecursive()).resolves.toEqual([
        `/${REPO_ROOT}/foo/tmp/.gitkeep`,
        `/${REPO_ROOT}/foo/bar/index.js`,
        `/${REPO_ROOT}/foo/README.md`,
        `/${REPO_ROOT}/README.md`,
      ]);
    });

    it('when moved again, safely moves to the new directory', async () => {
      await subject.rename(`/${REPO_ROOT}/foo/tmp`, `/${REPO_ROOT}/foo/bar/tmp`);

      await expect(subject.exists(`/${REPO_ROOT}/foo/tmp`)).resolves.toBe(false);
      await expect(lsRecursive()).resolves.toEqual([
        `/${REPO_ROOT}/foo/bar/tmp/.gitkeep`,
        `/${REPO_ROOT}/foo/bar/index.js`,
        `/${REPO_ROOT}/foo/README.md`,
        `/${REPO_ROOT}/README.md`,
      ]);
    });
  });
});
