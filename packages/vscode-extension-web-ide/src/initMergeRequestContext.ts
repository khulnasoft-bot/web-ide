import { flow } from 'lodash';
import { cleanLeadingSeparator, joinPaths } from '@khulnasoft/utils-path';
import type {
  FetchMergeRequestDiffStatsResponse,
  StartCommandResponse,
} from '@khulnasoft/vscode-mediator-commands';
import * as vscode from 'vscode';
import {
  COMPARE_WITH_MR_BASE_COMMAND_ID,
  FS_SCHEME,
  MERGE_REQUEST_FILE_PATHS_CONTEXT_ID,
  MR_SCHEME,
} from './constants';
import { GitLabFileContentProvider } from './GitLabFileContentProvider';
import { fetchMergeRequestDiffStats } from './mediator';
import { GitLabReadonlyFileSystemProvider } from './vscode/GitLabReadonlyFileSystemProvider';
import { MergeRequestFileDecorationProvider } from './vscode/MergeRequestFileDecorationProvider';
import { FileContentProviderWith404AsEmpty, FileContentProviderWithRepoRoot } from './utils/fs';
import { createSetOfAllPaths } from './utils/createSetOfAllPaths';

// why: Export for testing
export const MSG_LOADING_MERGE_REQUEST = 'Loading merge request details...';
export const MSG_FAILED =
  'Failed to load merge request details. See the console for more information.';
const MAX_FILES_TO_OPEN = 10;

type InitMergeRequestOptions = {
  mergeRequest: NonNullable<StartCommandResponse['mergeRequest']>;
  files: StartCommandResponse['files'];
  repoRoot: string;
  isReload: boolean;
};

const getMergeRequestChanges = async ({
  mergeRequest,
  files,
  repoRoot,
}: InitMergeRequestOptions) => {
  const allFiles = new Set(
    files.filter(x => x.type === 'blob').map(x => cleanLeadingSeparator(x.path)),
  );

  const diffStats = await fetchMergeRequestDiffStats({
    mergeRequestId: mergeRequest.id,
  });

  return (
    diffStats
      // what: We are only interesting in Modified/Created changes. Deletions
      //       aren't presentable at the moment, so let's ignore them.
      .filter(x => allFiles.has(cleanLeadingSeparator(x.path)))
      .map(x => ({
        ...x,
        path: joinPaths('/', repoRoot, x.path),
      }))
  );
};

const initMergeRequestFileDecorator = (
  disposables: vscode.Disposable[],
  mrChanges: Awaited<ReturnType<typeof getMergeRequestChanges>>,
) => {
  const mrPathsSet = createSetOfAllPaths(mrChanges.map(x => x.path));

  disposables.push(
    vscode.window.registerFileDecorationProvider(
      new MergeRequestFileDecorationProvider(mrPathsSet),
    ),
  );
};

const initMergeRequestFileSystem = (
  disposables: vscode.Disposable[],
  { mergeRequest, repoRoot }: InitMergeRequestOptions,
) => {
  // what: Apply decorators to base GitLabFileContentProvider
  const mrContentProvider = flow(
    // why: Strip the repoRoot which is passed to the FileSystemProvider
    x => new FileContentProviderWithRepoRoot(x, repoRoot),
    // why: If we receive a 404, it probably means we are adding a new file, so just treat as empty
    x => new FileContentProviderWith404AsEmpty(x),
  )(new GitLabFileContentProvider(mergeRequest.baseSha));

  disposables.push(
    vscode.workspace.registerFileSystemProvider(
      MR_SCHEME,
      new GitLabReadonlyFileSystemProvider(mrContentProvider),
      {
        isReadonly: true,
      },
    ),
  );
};

const getTotalChanges = ({ additions, deletions }: FetchMergeRequestDiffStatsResponse[0]) =>
  additions + deletions;

const openMergeRequestChanges = async (mrChanges: FetchMergeRequestDiffStatsResponse) => {
  const pathsToOpen = [...mrChanges]
    .sort((a, b) => getTotalChanges(b) - getTotalChanges(a))
    .slice(0, MAX_FILES_TO_OPEN)
    .map(x => x.path)
    .reverse();

  await Promise.allSettled(
    pathsToOpen.map(path =>
      vscode.commands.executeCommand(
        COMPARE_WITH_MR_BASE_COMMAND_ID,
        vscode.Uri.from({ scheme: FS_SCHEME, path }),
        undefined,
        { preview: false },
      ),
    ),
  );
};

export const initMergeRequestContext = async (
  disposables: vscode.Disposable[],
  progress: vscode.Progress<{ increment: number; message: string }>,
  options: InitMergeRequestOptions,
) => {
  progress.report({ increment: -1, message: MSG_LOADING_MERGE_REQUEST });

  try {
    const mrChanges = await getMergeRequestChanges(options);

    await vscode.commands.executeCommand(
      'setContext',
      MERGE_REQUEST_FILE_PATHS_CONTEXT_ID,
      mrChanges.map(x => x.path),
    );

    initMergeRequestFileDecorator(disposables, mrChanges);
    initMergeRequestFileSystem(disposables, options);

    if (!options.isReload) {
      await openMergeRequestChanges(mrChanges);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);

    // why: We want to fire-and-forget
    vscode.window.showWarningMessage(MSG_FAILED);
  }
};
