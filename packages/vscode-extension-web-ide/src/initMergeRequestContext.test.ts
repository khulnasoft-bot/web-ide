// TODO: For some reason `ts-jest` isn't finding the `.d.ts` files
import '../vscode.proposed.codiconDecoration.d';

import * as vscode from 'vscode';
import { basename, joinPaths } from '@khulnasoft/utils-path';
import {
  initMergeRequestContext,
  MSG_FAILED,
  MSG_LOADING_MERGE_REQUEST,
} from './initMergeRequestContext';
import { fetchMergeRequestDiffStats } from './mediator';
import { createFakeProgress } from '../test-utils/vscode';
import { MergeRequestFileDecorationProvider } from './vscode/MergeRequestFileDecorationProvider';
import {
  COMPARE_WITH_MR_BASE_COMMAND_ID,
  FS_SCHEME,
  MERGE_REQUEST_FILE_PATHS_CONTEXT_ID,
  MR_SCHEME,
} from './constants';
import { GitLabReadonlyFileSystemProvider } from './vscode/GitLabReadonlyFileSystemProvider';
import { FileContentProviderWith404AsEmpty, FileContentProviderWithRepoRoot } from './utils/fs';
import { GitLabFileContentProvider } from './GitLabFileContentProvider';

jest.mock('./mediator');

// why: There's some non-determinism in this class (specifically with the RateLimiter set up)
jest.mock('./GitLabFileContentProvider', () => ({
  // why: Provide custom mock so that equality checks work
  GitLabFileContentProvider: function MockGitLabFileContentProvider() {
    // intentional noop
  },
}));

const createTestFile = (type: 'blob' | 'tree', path: string) => ({
  id: path,
  type,
  path,
  mode: '',
  name: basename(path),
});

const TEST_OPTIONS: Parameters<typeof initMergeRequestContext>[2] = {
  repoRoot: 'gitlab-test',
  files: [
    // Ensure that we are cleaning leading separator
    createTestFile('blob', '/README.md'),
    createTestFile('tree', 'src'),
    createTestFile('blob', 'src/untouched.js'),
    createTestFile('tree', 'src/bar'),
    createTestFile('blob', 'src/bar/test.rs'),
  ],
  mergeRequest: {
    id: '7',
    baseSha: '000111',
    isMergeRequestBranch: true,
    mergeRequestUrl: 'https://gitlab.com/khulnasoft/web-ide/-/merge_requests/1',
  },
  isReload: false,
};
const TEST_DIFF_STATS: Awaited<ReturnType<typeof fetchMergeRequestDiffStats>> = [
  {
    path: 'README.md',
    additions: 7,
    deletions: 7,
  },
  {
    path: 'src/deleteme.js',
    additions: 0,
    deletions: 10,
  },
  {
    // Ensure that we are cleaning leading separator
    path: '/src/bar/test.rs',
    additions: 10,
    deletions: 0,
  },
];
const LARGE_DIFF_STATS: Awaited<ReturnType<typeof fetchMergeRequestDiffStats>> = Array(100)
  .fill(1)
  .map((_, idx) => ({
    path: `file_${idx}.md`,
    additions: idx,
    deletions: idx,
  }));

describe('initMergeRequestContext', () => {
  let progress: vscode.Progress<{ increment: number; message: string }>;
  let disposables: vscode.Disposable[];

  const createMockDisposable = (): vscode.Disposable => ({ dispose: jest.fn() });
  const getCallsForCommand = (commandId: string) =>
    jest.mocked(vscode.commands.executeCommand).mock.calls.filter(([id]) => id === commandId);

  beforeEach(() => {
    disposables = [];
    progress = createFakeProgress();

    jest
      .mocked(vscode.window.registerFileDecorationProvider)
      .mockImplementation(createMockDisposable);
    jest
      .mocked(vscode.workspace.registerFileSystemProvider)
      .mockImplementation(createMockDisposable);
    jest.mocked(fetchMergeRequestDiffStats).mockResolvedValue(TEST_DIFF_STATS);
  });

  describe('default', () => {
    beforeEach(async () => {
      await initMergeRequestContext(disposables, progress, TEST_OPTIONS);
    });

    it('calls progress', () => {
      expect(progress.report).toHaveBeenCalledWith({
        increment: -1,
        message: MSG_LOADING_MERGE_REQUEST,
      });
    });

    it('fetches merge request diff stats', () => {
      expect(fetchMergeRequestDiffStats).toHaveBeenCalledWith({
        mergeRequestId: TEST_OPTIONS.mergeRequest.id,
      });
    });

    it('registers merge request file decoration provider', () => {
      const provider = jest.mocked(vscode.window.registerFileDecorationProvider).mock.calls[0][0];
      const disposable = jest.mocked(vscode.window.registerFileDecorationProvider).mock.results[0]
        .value;

      expect(provider).toEqual(
        new MergeRequestFileDecorationProvider(
          new Set([
            // Note the inclusion of parents and the lack of `deleteme.js`
            '/gitlab-test',
            '/gitlab-test/README.md',
            '/gitlab-test/src/bar/test.rs',
            '/gitlab-test/src/bar',
            '/gitlab-test/src',
          ]),
        ),
      );
      expect(disposables).toContain(disposable);
    });

    it('registers file system provider', () => {
      const provider = jest.mocked(vscode.workspace.registerFileSystemProvider).mock.calls[0];
      const disposable = jest.mocked(vscode.workspace.registerFileSystemProvider).mock.results[0]
        .value;

      const baseContentProvider = new GitLabFileContentProvider(TEST_OPTIONS.mergeRequest.baseSha);
      const decoratedContentProvider = new FileContentProviderWith404AsEmpty(
        new FileContentProviderWithRepoRoot(baseContentProvider, TEST_OPTIONS.repoRoot),
      );

      expect(provider).toEqual([
        MR_SCHEME,
        new GitLabReadonlyFileSystemProvider(decoratedContentProvider),
        { isReadonly: true },
      ]);
      expect(disposables).toContain(disposable);
    });

    it('does not show warning message', () => {
      expect(vscode.window.showWarningMessage).not.toHaveBeenCalled();
    });

    it('sets context', () => {
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'setContext',
        MERGE_REQUEST_FILE_PATHS_CONTEXT_ID,
        [
          joinPaths('/', TEST_OPTIONS.repoRoot, TEST_DIFF_STATS[0].path),
          joinPaths('/', TEST_OPTIONS.repoRoot, TEST_DIFF_STATS[2].path),
        ],
      );
    });

    it('opens MR changes', () => {
      expect(getCallsForCommand(COMPARE_WITH_MR_BASE_COMMAND_ID)).toEqual(
        [
          joinPaths('/', TEST_OPTIONS.repoRoot, TEST_DIFF_STATS[2].path),
          joinPaths('/', TEST_OPTIONS.repoRoot, TEST_DIFF_STATS[0].path),
        ].map(path => [
          COMPARE_WITH_MR_BASE_COMMAND_ID,
          vscode.Uri.from({ scheme: FS_SCHEME, path }),
          undefined,
          { preview: false },
        ]),
      );
    });
  });

  describe('when called with isReload', () => {
    beforeEach(async () => {
      await initMergeRequestContext(disposables, progress, { ...TEST_OPTIONS, isReload: true });
    });

    it('does not open MR changes', () => {
      expect(getCallsForCommand(COMPARE_WITH_MR_BASE_COMMAND_ID)).toEqual([]);
    });
  });

  describe('with 100 MR changes', () => {
    beforeEach(async () => {
      jest.mocked(fetchMergeRequestDiffStats).mockResolvedValue(LARGE_DIFF_STATS);

      await initMergeRequestContext(disposables, progress, {
        ...TEST_OPTIONS,
        // why: We need to update `files` or the changes will be considered "deletions"
        //      and will not be opened.
        files: LARGE_DIFF_STATS.map(({ path }) => createTestFile('blob', path)),
      });
    });

    it('only opens top 10 MR changes', () => {
      // Note that this is the opposite order of the other opens MR changes test, implying that we're sorting here
      const paths = LARGE_DIFF_STATS.slice(LARGE_DIFF_STATS.length - 10).map(({ path }) =>
        joinPaths('/', TEST_OPTIONS.repoRoot, path),
      );

      expect(getCallsForCommand(COMPARE_WITH_MR_BASE_COMMAND_ID)).toEqual(
        paths.map(path => [
          COMPARE_WITH_MR_BASE_COMMAND_ID,
          vscode.Uri.from({ scheme: FS_SCHEME, path }),
          undefined,
          { preview: false },
        ]),
      );
    });
  });

  describe('when fetch diff stats fails', () => {
    let error: Error;

    beforeEach(async () => {
      error = new Error('SOMETHING BAD!');

      jest.mocked(fetchMergeRequestDiffStats).mockRejectedValue(error);
      jest.spyOn(console, 'error').mockImplementation();

      await initMergeRequestContext(disposables, progress, TEST_OPTIONS);
    });

    it('logs to console', () => {
      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalledWith(error);
    });

    it('shows warning message', () => {
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(MSG_FAILED);
    });
  });
});
