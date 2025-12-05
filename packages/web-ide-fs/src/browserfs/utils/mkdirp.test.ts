import { FileSystem } from 'browserfs';
import { FileSystemPromiseAdapter } from '../FileSystemPromiseAdapter';
import { mkdirp } from './mkdirp';
import { createAsPromise } from './createAsPromise';

describe('browserfs/utils/mkdirp', () => {
  let fs: FileSystemPromiseAdapter;

  beforeEach(async () => {
    fs = new FileSystemPromiseAdapter(await createAsPromise(FileSystem.InMemory.Create, {}));
  });

  it('fs starts out empty', async () => {
    expect(await fs.readdir('/')).toEqual([]);
  });

  describe('when called with nested paths', () => {
    beforeEach(async () => {
      await mkdirp(fs, '/foo/bar/test');
    });

    it('recursively makes directory', async () => {
      expect(await fs.readdir('/')).toEqual(['foo']);
      expect(await fs.readdir('/foo')).toEqual(['bar']);
      expect(await fs.readdir('/foo/bar')).toEqual(['test']);
      expect((await fs.stat('/foo/bar/test', false)).isDirectory()).toBe(true);
    });

    it('does nothing if path already exists', async () => {
      expect(await fs.readdir('/')).toEqual(['foo']);
      expect(await fs.readdir('/foo')).toEqual(['bar']);

      await mkdirp(fs, '/foo/bar');

      expect(await fs.readdir('/')).toEqual(['foo']);
      expect(await fs.readdir('/foo')).toEqual(['bar']);
    });
  });
});
