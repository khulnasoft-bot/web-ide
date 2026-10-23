import type * as vscode from 'vscode';
import type { FileStats, SourceControlFileSystem } from '@gitlab/web-ide-fs';
import { FileType } from '@gitlab/web-ide-fs';
import { SourceControlFileSystemProvider } from './SourceControlFileSystemProvider';
import { fromPathToScmUri, fromUriToScmUri } from '../scm/uri';

const TEST_CONTENT = Buffer.from('# Hello world!\n\nLorem\n');
const TEST_CONTENT_ORIGINAL = Buffer.from('# world!\n');
const TEST_STATS: FileStats = {
  ctime: 500,
  mtime: 600,
  size: 700,
  mode: 0x644,
  type: FileType.Blob,
};
const TEST_STATS_ORIGINAL: FileStats = {
  ctime: 300,
  mtime: 400,
  size: 500,
  mode: 0x644,
  type: FileType.Blob,
};

const TEST_PATH = '/foo/README.md';
const TEST_URI = fromPathToScmUri('README.md', '/foo');
const TEST_URI_PARAMS_HEAD = fromUriToScmUri(TEST_URI, 'HEAD');
const TEST_URI_PARAMS_BOGUS = fromUriToScmUri(TEST_URI, 'BOGUS');

describe('vscode/SourceControlFileSystemProvider', () => {
  let sourceControlFs: SourceControlFileSystem;
  let subject: SourceControlFileSystemProvider;

  beforeEach(() => {
    sourceControlFs = {
      readFile: jest.fn().mockResolvedValue(TEST_CONTENT),
      readFileOriginal: jest.fn().mockResolvedValue(TEST_CONTENT_ORIGINAL),
      stat: jest.fn().mockResolvedValue(TEST_STATS),
      statOriginal: jest.fn().mockResolvedValue(TEST_STATS_ORIGINAL),
    };

    subject = new SourceControlFileSystemProvider(sourceControlFs);
  });

  interface TestParameters {
    method: 'stat' | 'readFile';
    spyMethod: keyof SourceControlFileSystem;
    uri: vscode.Uri;
    expected: unknown;
  }

  it.each`
    method        | desc                      | spyMethod             | uri                      | expected
    ${'stat'}     | ${'with no params'}       | ${'stat'}             | ${TEST_URI}              | ${TEST_STATS}
    ${'stat'}     | ${'with param ref bogus'} | ${'stat'}             | ${TEST_URI_PARAMS_BOGUS} | ${TEST_STATS}
    ${'stat'}     | ${'with param ref HEAD'}  | ${'statOriginal'}     | ${TEST_URI_PARAMS_HEAD}  | ${TEST_STATS_ORIGINAL}
    ${'readFile'} | ${'with no params'}       | ${'readFile'}         | ${TEST_URI}              | ${TEST_CONTENT}
    ${'readFile'} | ${'with param ref bogus'} | ${'readFile'}         | ${TEST_URI_PARAMS_BOGUS} | ${TEST_CONTENT}
    ${'readFile'} | ${'with param ref HEAD'}  | ${'readFileOriginal'} | ${TEST_URI_PARAMS_HEAD}  | ${TEST_CONTENT_ORIGINAL}
  `('$method - $desc', async ({ method, uri, expected, spyMethod }: TestParameters) => {
    await expect(subject[method](uri)).resolves.toEqual(expected);

    await expect(sourceControlFs[spyMethod]).toHaveBeenCalledWith(TEST_PATH);
  });
});
