import type { FileContentProvider } from '../types';
import { createOverlayFS, createOverlayFSComponents } from './create';
import { DEFAULT_DATE } from './GitLabReadableFileSystem';
import { FakeFileContentProvider } from '../../test-utils/FakeFileContentProvider';
import { REPO_ROOT, DEFAULT_FILES, DEFAULT_FILE_ARRAY, bfsUtils } from '../../test-utils/fs';
import type { PromisifiedBrowserFS, ReadonlyPromisifiedBrowserFS } from './types';

describe('browserfs/create', () => {
  let contentProvider: FileContentProvider;
  let fs: PromisifiedBrowserFS;
  let writable: ReadonlyPromisifiedBrowserFS;
  let readable: ReadonlyPromisifiedBrowserFS;

  const createSubject = async () => {
    contentProvider = new FakeFileContentProvider(DEFAULT_FILES);

    const overlayFSComponents = await createOverlayFSComponents({
      contentProvider,
      gitLsTree: DEFAULT_FILE_ARRAY,
      repoRoot: REPO_ROOT,
    });
    fs = await createOverlayFS(overlayFSComponents);
    writable = overlayFSComponents.writable;
    readable = overlayFSComponents.readable;

    jest.spyOn(contentProvider, 'getContent');
  };

  describe('default', () => {
    beforeEach(async () => {
      await createSubject();
    });

    describe('readFile', () => {
      it('can read file content from contentProvider', async () => {
        const content = await bfsUtils.readRepoFile(fs, 'README.md');

        expect(content).toBe(DEFAULT_FILES['README.md']);
      });

      it('triggers contentProvider', async () => {
        expect(contentProvider.getContent).not.toHaveBeenCalled();

        await bfsUtils.readRepoFile(fs, '/README.md');

        expect(contentProvider.getContent).toHaveBeenCalledTimes(1);
        expect(contentProvider.getContent).toHaveBeenCalledWith('README.md');
      });

      it('only triggers contentProvider once per file', async () => {
        await bfsUtils.readRepoFile(fs, '/README.md');
        await bfsUtils.readRepoFile(fs, '/README.md');
        const content = await bfsUtils.readRepoFile(fs, '/README.md');

        expect(contentProvider.getContent).toHaveBeenCalledTimes(1);
        expect(content).toBe(DEFAULT_FILES['README.md']);
      });
    });

    describe('when directory is deleted', () => {
      beforeEach(async () => {
        await bfsUtils.rmRepoFile(fs, '/foo/bar/index.js');
        await bfsUtils.rmRepoFile(fs, '/foo/README.md');
        await bfsUtils.rmRepoFile(fs, '/foo/bar');
        await bfsUtils.rmRepoFile(fs, '/foo');
      });

      it('can readdir normally', async () => {
        expect(await bfsUtils.readAllRepoFiles(fs)).toEqual({
          [`/${REPO_ROOT}/README.md`]: DEFAULT_FILES['README.md'],
          [`/${REPO_ROOT}/tmp/.gitkeep`]: '',
        });
      });
    });

    describe('writable status (used to verify writable fs behavior)', () => {
      it('starts out as empty', async () => {
        const result = await bfsUtils.readAllFiles(writable);

        expect(result).toEqual({});
      });

      it('when file is written, it contains changes', async () => {
        await bfsUtils.writeRepoFile(fs, '/README.md', 'NEW CONTENT');

        const result = await bfsUtils.readAllFiles(writable);

        expect(result).toEqual({
          [`/${REPO_ROOT}/README.md`]: 'NEW CONTENT',
        });
      });

      it('when file is renamed, it contains deleted and new file', async () => {
        await fs.rename(`/${REPO_ROOT}/README.md`, `/${REPO_ROOT}/README_OLD.md`);

        const result = await bfsUtils.readAllFiles(writable);

        expect(result).toEqual({
          [`/${REPO_ROOT}/README_OLD.md`]: DEFAULT_FILES['README.md'],
          '/.deletedFiles.log': `file:/${REPO_ROOT}/README.md\n`,
        });
      });

      it('when file is renamed and renamed back, it contains entries', async () => {
        await fs.rename(`/${REPO_ROOT}/README.md`, `/${REPO_ROOT}/README_OLD.md`);
        await fs.rename(`/${REPO_ROOT}/README_OLD.md`, `/${REPO_ROOT}/README.md`);

        // There's a caveat to learn here.
        // The actual files existing in writable take precedence to the metadata in .deletedFiles.log
        expect(await bfsUtils.readAllFiles(writable)).toEqual({
          '/.deletedFiles.log': `file:/${REPO_ROOT}/README.md\n`,
          [`/${REPO_ROOT}/README.md`]: DEFAULT_FILES['README.md'],
        });

        await fs.unlink(`/${REPO_ROOT}/README.md`);

        expect(await bfsUtils.readAllFiles(writable)).toEqual({
          '/.deletedFiles.log': `file:/${REPO_ROOT}/README.md\n`,
        });
      });

      it('when nested folder is renamed', async () => {
        await fs.rename(`/${REPO_ROOT}/foo`, `/${REPO_ROOT}/foonew`);

        expect(await bfsUtils.readAllFiles(writable)).toEqual({
          '/.deletedFiles.log': 'dir:/test-repo/foo\n',
          '/test-repo/foonew/README.md': DEFAULT_FILES['foo/README.md'],
          '/test-repo/foonew/bar/index.js': DEFAULT_FILES['foo/bar/index.js'],
        });

        expect(await fs.readdir(`/${REPO_ROOT}`)).toEqual(['foonew', 'README.md', 'tmp']);
        expect(await fs.exists(`/${REPO_ROOT}/foo`)).toBe(false);
      });

      it('when nested folder is renamed back and forth', async () => {
        await fs.rename(`/${REPO_ROOT}/foo`, `/${REPO_ROOT}/foonew`);
        await fs.rename(`/${REPO_ROOT}/foonew`, `/${REPO_ROOT}/foo`);

        expect(await bfsUtils.readAllFiles(writable)).toEqual({
          '/.deletedFiles.log': 'dir:/test-repo/foo\n',
          '/test-repo/foo/README.md': DEFAULT_FILES['foo/README.md'],
          '/test-repo/foo/bar/index.js': DEFAULT_FILES['foo/bar/index.js'],
        });
        expect(await fs.readdir(`/${REPO_ROOT}`)).toEqual(['foo', 'README.md', 'tmp']);
      });
    });
  });

  describe('timestamps', () => {
    const startTime = new Date(2022, 0, 1, 1, 0, 0);
    const afterTime = new Date(2022, 0, 1, 2, 0, 0);
    const defaultTimeStat = {
      mtime: DEFAULT_DATE,
      atime: DEFAULT_DATE,
      ctime: DEFAULT_DATE,
    };
    const startTimeStat = {
      mtime: startTime,
      atime: startTime,
      ctime: startTime,
    };
    const afterTimeStat = {
      mtime: afterTime,
      atime: afterTime,
      ctime: afterTime,
    };

    let startStat: { mtime: Date; atime: Date; ctime: Date };

    beforeEach(async () => {
      jest.useFakeTimers().setSystemTime(startTime);
      await createSubject();

      startStat = await bfsUtils.statTime(fs, `/${REPO_ROOT}`);
    });

    it('initializes with timestamps', () => {
      expect(startStat).toEqual(defaultTimeStat);
    });

    it('initializes timestamp on actual fs root', async () => {
      // Hyptohesis: The reason this is not DEFAULT_DATE, but actual from the `startTime`
      //             is because DEFAULT_DATE is only used in *readable* file system
      //             and OverlayFS creates a *writable* file system with a new root dir.
      const rootStat = await bfsUtils.statTime(fs, '/');
      const readableRootStat = await bfsUtils.statTime(readable, '/');

      expect(readableRootStat).toEqual(defaultTimeStat);
      expect(rootStat).toEqual(startTimeStat);
    });

    it.todo('root timestamp changes on dir deleteion');
    it.todo('root timestamp changes on file rename');
    it.todo('root timestamp changes on file change then change back');
    it.todo('root timestamp when modifying 2+ levels');

    describe.each`
      desc             | path
      ${'file'}        | ${'README.md'}
      ${'nested file'} | ${'foo/README.md'}
    `('when $desc is removed', ({ path }: { path: string }) => {
      beforeEach(async () => {
        jest.setSystemTime(afterTime);
        await bfsUtils.rmRepoFile(fs, path);
      });

      it('root timestamp does NOT change - not supported by browserfs :(', async () => {
        const afterStat = await bfsUtils.statTime(fs, `/${REPO_ROOT}`);

        expect(afterStat).toEqual(startStat);
      });

      it('writable deletedFiles.log timestamp changes', async () => {
        const afterStat = await bfsUtils.statTime(writable, `/.deletedFiles.log`);

        expect(afterStat.mtime.getTime()).toBeGreaterThan(startStat.mtime.getTime());
        expect(afterStat).toEqual(afterTimeStat);
      });
    });

    describe('when nested file is updated', () => {
      let afterStat: { mtime: Date; atime: Date; ctime: Date };

      beforeEach(async () => {
        jest.setSystemTime(afterTime);
        await bfsUtils.writeRepoFile(fs, 'foo/README.md', 'New file content\n');
        afterStat = await bfsUtils.statTime(fs, `/${REPO_ROOT}`);
      });

      it('root timestamp does NOT change - not supported by browserfs :(', async () => {
        const rootStat = await bfsUtils.statTime(fs, '/');

        expect(rootStat).toEqual(startTimeStat);
      });

      it('root timestamp (on writable) does NOT change - not supported by browserfs :(', async () => {
        const rootStat = await bfsUtils.statTime(writable, '/');

        expect(rootStat).toEqual(startTimeStat);
      });

      it('repo root timestamp changes', async () => {
        expect(afterStat.mtime.getTime()).toBeGreaterThan(startStat.mtime.getTime());
        expect(afterStat).toEqual(afterTimeStat);
      });

      it('timestamp across path changes', async () => {
        expect(await bfsUtils.statTime(fs, `/${REPO_ROOT}/foo`)).toEqual(afterStat);
        expect(await bfsUtils.statTime(fs, `/${REPO_ROOT}/foo/README.md`)).toEqual(afterStat);
      });

      it('timestamp on untouched paths is unchanged', async () => {
        expect(await bfsUtils.statTime(fs, `/${REPO_ROOT}/README.md`)).toEqual(startStat);
        expect(await bfsUtils.statTime(fs, `/${REPO_ROOT}/foo/bar/index.js`)).toEqual(startStat);
      });
    });
  });
});
