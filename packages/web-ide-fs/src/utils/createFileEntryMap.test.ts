import { DEFAULT_FILE_ARRAY } from '../../test-utils/fs';
import { FileType } from '../types';
import type { MutableTreeEntry, MutableBlobEntry } from './index';
import { createFileEntryMap, BlobContentType } from './index';

const convertMapToObj = <T>(map: Map<string, T>): Record<string, T> => {
  const result: Record<string, T> = {};

  for (const [key, value] of map.entries()) {
    result[key] = value;
  }

  return result;
};

const createTree = (name: string, children: string[]): MutableTreeEntry => ({
  ctime: 0,
  mtime: 0,
  size: 0,
  mode: 0,
  type: FileType.Tree,
  name,
  children,
});

const createBlob = (name: string, path: string, mode: number): MutableBlobEntry => ({
  ctime: 0,
  mtime: 0,
  size: 0,
  mode,
  type: FileType.Blob,
  name,
  content: {
    type: BlobContentType.Unloaded,
    path,
  },
});

describe('utils/createFileEntryMap', () => {
  it('with empty, creates empty root directory', () => {
    const result = createFileEntryMap([], 'my-cool-project');

    const actual = convertMapToObj(result);

    expect(actual).toEqual({
      '/': createTree('/', ['/my-cool-project']),
      '/my-cool-project': createTree('my-cool-project', []),
    });
  });

  it('with ls-tree data, returns map of file entries', () => {
    const file1 = {
      path: 'file',
      mode: '140000',
    };
    const file2 = {
      path: 'dir1/dir2/file2.js',
      mode: '155555',
    };
    const result = createFileEntryMap([file1, file2], '/');

    const actual = convertMapToObj(result);

    expect(actual).toEqual({
      '/': createTree('/', ['/file', '/dir1']),
      '/dir1': createTree('dir1', ['/dir1/dir2']),
      '/dir1/dir2': createTree('dir2', ['/dir1/dir2/file2.js']),
      '/dir1/dir2/file2.js': createBlob('file2.js', 'dir1/dir2/file2.js', 0o155555),
      '/file': createBlob('file', 'file', 0o140000),
    });
  });

  it('with repoRoot, returns map of file entries nested under root', () => {
    const file1 = {
      path: 'file',
      mode: '140000',
    };
    const file2 = {
      path: 'dir1/dir2/file2.js',
      mode: '155555',
    };
    const result = createFileEntryMap([file1, file2], 'lorem-ipsum');

    const actual = convertMapToObj(result);

    expect(actual).toEqual({
      '/': createTree('/', ['/lorem-ipsum']),
      '/lorem-ipsum': createTree('lorem-ipsum', ['/lorem-ipsum/file', '/lorem-ipsum/dir1']),
      '/lorem-ipsum/dir1': createTree('dir1', ['/lorem-ipsum/dir1/dir2']),
      '/lorem-ipsum/dir1/dir2': createTree('dir2', ['/lorem-ipsum/dir1/dir2/file2.js']),
      // Path to blob content stays the same (not effected by repo root)
      '/lorem-ipsum/dir1/dir2/file2.js': createBlob('file2.js', 'dir1/dir2/file2.js', 0o155555),
      '/lorem-ipsum/file': createBlob('file', 'file', 0o140000),
    });
  });

  it('with default files, returns map of file entries nested under root', () => {
    const result = createFileEntryMap(DEFAULT_FILE_ARRAY, 'lorem-ipsum');

    const actual = convertMapToObj(result);

    expect(actual).toEqual({
      '/': createTree('/', ['/lorem-ipsum']),
      '/lorem-ipsum': createTree('lorem-ipsum', [
        '/lorem-ipsum/README.md',
        '/lorem-ipsum/foo',
        '/lorem-ipsum/tmp',
      ]),
      '/lorem-ipsum/README.md': createBlob('README.md', 'README.md', 0o100644),
      '/lorem-ipsum/foo': createTree('foo', ['/lorem-ipsum/foo/bar', '/lorem-ipsum/foo/README.md']),
      '/lorem-ipsum/foo/README.md': createBlob('README.md', 'foo/README.md', 0o100555),
      '/lorem-ipsum/foo/bar': createTree('bar', ['/lorem-ipsum/foo/bar/index.js']),
      '/lorem-ipsum/foo/bar/index.js': createBlob('index.js', 'foo/bar/index.js', 0o100655),
      '/lorem-ipsum/tmp': createTree('tmp', ['/lorem-ipsum/tmp/.gitkeep']),
      '/lorem-ipsum/tmp/.gitkeep': createBlob('.gitkeep', 'tmp/.gitkeep', 0o100644),
    });
  });
});
