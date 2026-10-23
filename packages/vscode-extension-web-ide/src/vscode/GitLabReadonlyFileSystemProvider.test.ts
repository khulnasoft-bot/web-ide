import * as vscode from 'vscode';
import type { FileContentProvider } from '@gitlab/web-ide-fs';
import { GitLabReadonlyFileSystemProvider } from './GitLabReadonlyFileSystemProvider';

const TEST_CONTENT = Buffer.from('Hello world!');

describe('vscode/GitLabReadonlyFileSystemProvider', () => {
  let contentProvider: FileContentProvider;
  let subject: GitLabReadonlyFileSystemProvider;

  beforeEach(() => {
    contentProvider = {
      getContent: jest.fn().mockResolvedValue(TEST_CONTENT),
    };
    subject = new GitLabReadonlyFileSystemProvider(contentProvider);
  });

  describe('stat', () => {
    it('returns empty stat', () => {
      expect(subject.stat()).toEqual({
        ctime: 0,
        mtime: 0,
        size: -1,
        type: vscode.FileType.File,
      });
    });
  });

  describe('readFile', () => {
    it('calls underlying content provider', async () => {
      await expect(
        subject.readFile(vscode.Uri.parse('file:///test/foo/README.md')),
      ).resolves.toEqual(TEST_CONTENT);

      expect(contentProvider.getContent).toHaveBeenCalledWith('/test/foo/README.md');
    });
  });
});
