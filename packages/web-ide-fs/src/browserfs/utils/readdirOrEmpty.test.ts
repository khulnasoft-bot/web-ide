import { FileSystem } from 'browserfs';
import { FileSystemPromiseAdapter } from '../FileSystemPromiseAdapter';
import { mkdirp } from './mkdirp';
import { readdirOrEmpty } from './readdirOrEmpty';
import { createAsPromise } from './createAsPromise';

describe('browserfs/utils/readdirOrEmpty', () => {
  let fs: FileSystemPromiseAdapter;

  beforeEach(async () => {
    fs = new FileSystemPromiseAdapter(await createAsPromise(FileSystem.InMemory.Create, {}));

    await mkdirp(fs, '/foo/bar/lorem');
    await mkdirp(fs, '/foo/bar/ipsum');
    await mkdirp(fs, '/foo/bar/dolar');
  });

  it.each`
    path                     | expected
    ${'/foo/does-not-exist'} | ${[]}
    ${'/foo/bar'}            | ${['lorem', 'ipsum', 'dolar']}
  `('with path = $path, expected = $expected', async ({ path, expected }) => {
    expect(await readdirOrEmpty(fs, path)).toEqual(expected);
  });
});
