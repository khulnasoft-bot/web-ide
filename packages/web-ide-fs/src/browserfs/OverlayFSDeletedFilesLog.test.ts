import { FileSystem } from 'browserfs';
import { FileFlag } from 'browserfs/dist/node/core/file_flag';
import { createAsPromise } from './utils';
import { FileSystemPromiseAdapter } from './FileSystemPromiseAdapter';
import { OverlayFSDeletedFilesLog } from './OverlayFSDeletedFilesLog';

const TEST_LOG_PATH = '/.test-deleted-files.log';
const MOCK_DATE = new Date(2022, 10, 10);

describe('browserfs/OverlayFSDeletedFilesLog', () => {
  jest.useFakeTimers().setSystemTime(MOCK_DATE);

  let fs: FileSystemPromiseAdapter;
  let subject: OverlayFSDeletedFilesLog;

  const readLogFile = async () =>
    // why: We know this is a string because we provided 'utf-8'
    <string>await fs.readFile(TEST_LOG_PATH, 'utf-8', FileFlag.getFileFlag('r'));

  beforeEach(async () => {
    fs = new FileSystemPromiseAdapter(await createAsPromise(FileSystem.InMemory.Create, {}));
    subject = new OverlayFSDeletedFilesLog(fs, TEST_LOG_PATH);
  });

  describe('default', () => {
    it('does not create log yet', async () => {
      expect(await fs.exists(TEST_LOG_PATH)).toBe(false);
    });

    it('has default modified time', async () => {
      expect(await subject.getModifiedTime()).toBe(-1);
    });

    describe('isDeleted', () => {
      it('returns false', async () => {
        expect(await subject.isDeleted('/anything')).toBe(false);
      });
    });
  });

  describe('with deletions added', () => {
    beforeEach(async () => {
      await subject.append('dir', '/tmp');
      await subject.append('file', '/index.js');
      await subject.append('file', '/src/frontend/outdated.js');
      // Let's try one with a trailing slash
      await subject.append('dir', '/src/frontend/bad_code/');
    });

    it('updates log file', async () => {
      expect(await readLogFile()).toMatchInlineSnapshot(`
        "dir:/tmp
        file:/index.js
        file:/src/frontend/outdated.js
        dir:/src/frontend/bad_code
        "
      `);
    });

    it('updates modified time', async () => {
      expect(await subject.getModifiedTime()).toBe(MOCK_DATE.getTime());
    });

    describe('isDeleted', () => {
      it.each`
        path                                                | expected
        ${''}                                               | ${false}
        ${'/'}                                              | ${false}
        ${'/src/frontend'}                                  | ${false}
        ${'/src/outdated.js'}                               | ${false}
        ${'/tmp'}                                           | ${true}
        ${'/tmp/foo.js'}                                    | ${true}
        ${'/tmp/spec/frontend/foo.js'}                      | ${true}
        ${'/index.js'}                                      | ${true}
        ${'/index.js/'}                                     | ${true}
        ${'/src/frontend/bad_code/files/my_files/test.txt'} | ${true}
      `('with path=$path, expected=$expected', async ({ path, expected }) => {
        expect(await subject.isDeleted(path)).toBe(expected);
      });
    });
  });

  describe('with directory that has trailing space', () => {
    beforeEach(async () => {
      await subject.append('dir', '/src/frontend ');
      await subject.append('file', '/src/frontend /outdated.js');
    });

    it('getContents returns directory with leading space', async () => {
      const contents = await subject.getContents();

      // why: Using inline snapshot is a simple way to compare this object with a Set
      expect(contents).toMatchInlineSnapshot(`
        Object {
          "directories": Set {
            "/src/frontend ",
          },
          "files": Set {
            "/src/frontend /outdated.js",
          },
        }
      `);
    });
  });

  describe('with deleted-files log containing empty lines', () => {
    beforeEach(async () => {
      await fs.writeFile(
        TEST_LOG_PATH,
        'dir:/foo\n\n\n\nfile:/foo/bar\n',
        null,
        FileFlag.getFileFlag('w'),
        0o600,
      );
    });

    it('getContents ignores empty lines', async () => {
      const contents = await subject.getContents();

      expect(contents).toMatchInlineSnapshot(`
        Object {
          "directories": Set {
            "/foo",
          },
          "files": Set {
            "/foo/bar",
          },
        }
      `);
    });
  });
});
