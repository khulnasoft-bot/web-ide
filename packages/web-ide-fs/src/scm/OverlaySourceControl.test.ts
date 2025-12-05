import { FileFlag } from 'browserfs/dist/node/core/file_flag';
import {
  REPO_ROOT,
  DEFAULT_FILES,
  bfsUtils,
  stringToBuffer,
  createDefaultOverlayFS,
} from '../../test-utils/fs';
import { OverlaySourceControl } from './OverlaySourceControl';
import { FileStatusType } from '../types';
import type { PromisifiedBrowserFS } from '../browserfs/types';
import { MODE_DEFAULT } from '../constants';

describe('scm/OverlaySourceControl', () => {
  let fs: PromisifiedBrowserFS;
  let subject: OverlaySourceControl;

  const createSubject = async () => {
    const result = await createDefaultOverlayFS();

    fs = result.fs;

    subject = new OverlaySourceControl({
      readable: result.readable,
      writable: result.writable,
      deletedFilesLog: result.deletedFilesLog,
      repoRootPath: REPO_ROOT,
    });
  };

  describe('default', () => {
    beforeEach(async () => {
      await createSubject();
    });

    it('when nothing, returns empty', async () => {
      expect(await subject.status()).toEqual([]);
    });

    it('when file is created, returns status', async () => {
      await bfsUtils.writeRepoFile(
        fs,
        '/brand_new_file.md',
        '## HelloWorld\nLorem ipsum dolar sit\n',
      );

      expect(await subject.status()).toEqual([
        {
          type: FileStatusType.Created,
          path: '/brand_new_file.md',
          content: expect.anything(),
        },
      ]);
    });

    it('when file is removed, returns status', async () => {
      await bfsUtils.rmRepoFile(fs, '/foo/README.md');

      expect(await subject.status()).toEqual([
        {
          type: FileStatusType.Deleted,
          path: '/foo/README.md',
        },
      ]);
    });

    it('when file is modified, returns status', async () => {
      const content = '# Hello World\n\nI have changed\n';
      const contentBuffer = Buffer.from(content, 'utf-8');

      await bfsUtils.writeRepoFile(fs, '/foo/README.md', content);

      expect(await subject.status()).toEqual([
        {
          type: FileStatusType.Modified,
          path: '/foo/README.md',
          content: contentBuffer,
        },
      ]);
    });

    it('when file is modified to original content, returns empty status', async () => {
      const originalContent = await bfsUtils.readRepoFile(fs, '/foo/README.md');

      await bfsUtils.writeRepoFile(fs, '/foo/README.md', '');
      await bfsUtils.writeRepoFile(fs, '/foo/README.md', originalContent);

      expect(await subject.status()).toEqual([]);
    });

    it('when file is deleted and then re-added with new content, returns modified status', async () => {
      const content = '# Hello World\n\nI have changed\n';
      const contentBuffer = Buffer.from(content, 'utf-8');

      await bfsUtils.rmRepoFile(fs, '/foo/README.md');
      await bfsUtils.writeRepoFile(fs, '/foo/README.md', content);

      expect(await subject.status()).toEqual([
        {
          type: FileStatusType.Modified,
          path: '/foo/README.md',
          content: contentBuffer,
        },
      ]);
    });

    it('when file is deleted and then re-added with no changes, returns empty status', async () => {
      const originalContent = await bfsUtils.readRepoFile(fs, '/foo/README.md');

      await bfsUtils.rmRepoFile(fs, '/foo/README.md');
      await bfsUtils.writeRepoFile(fs, '/foo/README.md', originalContent);

      expect(await subject.status()).toEqual([]);
    });

    it('when directory is renamed, returns removed and added status', async () => {
      await fs.rename(`/${REPO_ROOT}/foo`, `/${REPO_ROOT}/src`);

      expect(await subject.status()).toEqual([
        {
          type: FileStatusType.Deleted,
          path: '/foo/bar/index.js',
        },
        {
          type: FileStatusType.Deleted,
          path: '/foo/README.md',
        },
        {
          type: FileStatusType.Created,
          path: '/src/bar/index.js',
          content: stringToBuffer(DEFAULT_FILES['foo/bar/index.js']),
        },
        {
          type: FileStatusType.Created,
          path: '/src/README.md',
          content: stringToBuffer(DEFAULT_FILES['foo/README.md']),
        },
      ]);
    });

    it('when file is renamed, returns added and deleted status', async () => {
      await fs.rename(`/${REPO_ROOT}/README.md`, `/${REPO_ROOT}/README.txt`);

      expect(await subject.status()).toEqual([
        {
          type: FileStatusType.Deleted,
          path: '/README.md',
        },
        {
          type: FileStatusType.Created,
          path: '/README.txt',
          content: stringToBuffer(DEFAULT_FILES['README.md']),
        },
      ]);
    });

    it('when directory is removed and file is added in its place, returns status', async () => {
      await fs.rmdir(`/${REPO_ROOT}/foo`);
      await fs.writeFile(
        `/${REPO_ROOT}/foo`,
        'Test new content!\n',
        'utf-8',
        FileFlag.getFileFlag('w'),
        MODE_DEFAULT,
      );

      expect(await subject.status()).toEqual([
        {
          type: FileStatusType.Deleted,
          path: '/foo/bar/index.js',
        },
        {
          type: FileStatusType.Deleted,
          path: '/foo/README.md',
        },
        {
          type: FileStatusType.Created,
          path: '/foo',
          content: stringToBuffer('Test new content!\n'),
        },
      ]);
    });

    it('when directory is renamed twice', async () => {
      await fs.rename(`/${REPO_ROOT}/tmp`, `/${REPO_ROOT}/foo/tmp`);
      await fs.rename(`/${REPO_ROOT}/foo/tmp`, `/${REPO_ROOT}/foo/bar/tmp_4`);

      expect(await subject.status()).toEqual([
        {
          type: FileStatusType.Deleted,
          path: '/tmp/.gitkeep',
        },
        {
          type: FileStatusType.Created,
          path: '/foo/bar/tmp_4/.gitkeep',
          content: stringToBuffer(''),
        },
      ]);
    });
  });
});
