import type { FileSystem } from '@gitlab/web-ide-fs';
import type { FileChangeEvent } from 'vscode';
import { FileChangeType, Uri } from 'vscode';
import { GitLabFileSystemProvider } from './GitLabFileSystemProvider';
import { createFileSystemMock } from '../../test-utils/fs';

describe('vscode/GitLabFileSystemProvider', () => {
  let fs: jest.Mocked<FileSystem>;
  let subject: GitLabFileSystemProvider;
  let changeSpy: jest.Mock<unknown, [e: FileChangeEvent[]]>;

  const TEST_FILE_URI = Uri.parse('gitlab-web-ide:///test/foo.md');
  const TEST_NEW_FILE_URI = Uri.parse('gitlab-web-ide:///test/foo_new.md');
  const TEST_CONTENT = new Uint8Array();

  beforeEach(() => {
    fs = createFileSystemMock();
    subject = new GitLabFileSystemProvider(fs);
    changeSpy = jest.fn();

    subject.onDidChangeFile(changeSpy);
  });

  afterEach(() => {
    subject.dispose();
  });

  describe('triggers change', () => {
    it.each([
      [
        'when delete',
        // act
        () => subject.delete(TEST_FILE_URI, { recursive: false }),
        // expectation
        [{ type: FileChangeType.Deleted, uri: TEST_FILE_URI }],
      ],
      [
        'when writeFile',
        // act
        () => subject.writeFile(TEST_FILE_URI, TEST_CONTENT, { create: true, overwrite: true }),
        // expectation
        [{ type: FileChangeType.Changed, uri: TEST_FILE_URI }],
      ],
      [
        'when rename',
        // act
        () => subject.rename(TEST_FILE_URI, TEST_NEW_FILE_URI, { overwrite: true }),
        // expectation
        [
          { type: FileChangeType.Deleted, uri: TEST_FILE_URI },
          { type: FileChangeType.Changed, uri: TEST_NEW_FILE_URI },
        ],
      ],
    ])('%s', async (desc, act, expectation) => {
      await act();

      expect(changeSpy).toHaveBeenCalledTimes(1);
      expect(changeSpy).toHaveBeenCalledWith(expectation);
    });
  });
});
