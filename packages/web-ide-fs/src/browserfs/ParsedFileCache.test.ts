import { FileSystem } from 'browserfs';
import { FileFlag } from 'browserfs/dist/node/core/file_flag';
import { MODE_DEFAULT } from '../constants';
import { FileSystemPromiseAdapter } from './FileSystemPromiseAdapter';
import { ParsedFileCache } from './ParsedFileCache';
import { createAsPromise } from './utils';

const TEST_FILE_PATH = '/.test_file.json';
const TEST_CONTENT = {
  students: 30,
  teachers: 2,
  money: 100,
};

describe('browserfs/ParsedFileCache', () => {
  let fs: FileSystemPromiseAdapter;
  let subject: ParsedFileCache<Record<string, number>>;
  let parser: jest.Mock<Promise<Record<string, number>>, [string]>;

  const writeTestContent = (content: string) =>
    fs.writeFile(TEST_FILE_PATH, content, 'utf-8', FileFlag.getFileFlag('w'), MODE_DEFAULT);

  beforeEach(async () => {
    fs = new FileSystemPromiseAdapter(await createAsPromise(FileSystem.InMemory.Create, {}));
    parser = jest
      .fn()
      .mockImplementation((content: string) => Promise.resolve(JSON.parse(content)));
    jest.spyOn(fs, 'readFile');
  });

  describe('default', () => {
    beforeEach(() => {
      subject = new ParsedFileCache(fs, TEST_FILE_PATH, parser);
    });

    it('returns null at first', async () => {
      expect(await subject.getContents()).toBeNull();
    });

    it('doesnt read file or call parser', () => {
      expect(parser).not.toHaveBeenCalled();
      expect(fs.readFile).not.toHaveBeenCalled();
    });

    describe('when file changes', () => {
      beforeEach(async () => {
        await writeTestContent(JSON.stringify(TEST_CONTENT));
      });

      it('returns parsed content', async () => {
        expect(await subject.getContents()).toEqual(TEST_CONTENT);
      });

      it('caches result', async () => {
        await subject.getContents();
        await subject.getContents();
        await subject.getContents();

        expect(fs.readFile).toBeCalledTimes(1);
        expect(parser).toBeCalledTimes(1);
      });
    });
  });

  describe('file system with values', () => {
    beforeEach(async () => {
      await writeTestContent(JSON.stringify(TEST_CONTENT));

      subject = new ParsedFileCache(fs, TEST_FILE_PATH, parser);
    });

    it('returns parsed content', async () => {
      expect(await subject.getContents()).toEqual(TEST_CONTENT);
    });

    describe('after change', () => {
      beforeEach(async () => {
        // Trigger caching on original value to test that caching is updated
        await subject.getContents();

        await writeTestContent(JSON.stringify({}));
      });

      it('caches result', async () => {
        expect(fs.readFile).toBeCalledTimes(1);
        expect(parser).toBeCalledTimes(1);

        // Trigger multiple calls to test caching
        expect(await subject.getContents()).toEqual({});
        expect(await subject.getContents()).toEqual({});
        expect(await subject.getContents()).toEqual({});

        expect(fs.readFile).toBeCalledTimes(2);
        expect(parser).toBeCalledTimes(2);
      });
    });
  });
});
