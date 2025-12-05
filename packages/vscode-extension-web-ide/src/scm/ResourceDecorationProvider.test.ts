import type { FileStatus } from '@gitlab/web-ide-fs';
import { FileStatusType } from '@gitlab/web-ide-fs';
import type * as vscode from 'vscode';
import { ResourceDecorationProvider } from './ResourceDecorationProvider';
import { createStatusViewModel, toFileDecoration } from './status';

const TEST_REPO_ROOT = '/test-repo-root';
const TEST_STATUSES: FileStatus[] = [
  {
    type: FileStatusType.Deleted,
    path: '/tests/all_of_them.test.js',
  },
  {
    type: FileStatusType.Created,
    path: '/src/definitely_works.js',
    content: Buffer.from('Hello World!'),
  },
];
const TEST_STATUSES_VMS = TEST_STATUSES.map(x => createStatusViewModel(x, TEST_REPO_ROOT));

describe('scm/ResourceDecorationProvider', () => {
  let subject: ResourceDecorationProvider;
  let fileDecorationProvider: vscode.FileDecorationProvider;
  let onChangeSpy: jest.Mock<unknown, unknown[]>;

  beforeEach(() => {
    onChangeSpy = jest.fn();
    subject = new ResourceDecorationProvider();
    fileDecorationProvider = subject.createVSCodeDecorationProvider();
    fileDecorationProvider.onDidChangeFileDecorations?.(onChangeSpy);
  });

  it('does not trigger onDidChangeFileDecorations', () => {
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  describe('when update is called', () => {
    beforeEach(() => {
      subject.update(TEST_STATUSES_VMS);
    });

    it('triggers onDidChangeFileDecorations', () => {
      expect(onChangeSpy).toHaveBeenCalledWith(TEST_STATUSES_VMS.map(x => x.uri));
    });

    it('will provide file decoration, through the previously created provider', () => {
      const actual = TEST_STATUSES_VMS.map(({ uri }) =>
        fileDecorationProvider.provideFileDecoration(uri, {} as vscode.CancellationToken),
      );

      expect(actual).toEqual(TEST_STATUSES_VMS.map(toFileDecoration));
    });

    it('when called again with empty statuses, will clear decorations', () => {
      subject.update([]);

      const actual = TEST_STATUSES_VMS.map(({ uri }) =>
        fileDecorationProvider.provideFileDecoration(uri, {} as vscode.CancellationToken),
      );

      expect(actual).toEqual(TEST_STATUSES_VMS.map(() => undefined));
    });
  });
});
