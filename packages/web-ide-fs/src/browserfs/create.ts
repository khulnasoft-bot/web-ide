import './shim';

import { FileSystem } from 'browserfs';
import type { OverlayFSOptions } from './OverlayFS';
import OverlayFS from './OverlayFS';
import type { FileContentProvider, GitLsTreeEntry } from '../types';
import { createFileEntryMap } from '../utils';
import { GitLabReadableFileSystem } from './GitLabReadableFileSystem';
import { initializeEnvironment } from './initializeEnvironment';
import { createAsPromise } from './utils';
import type { PromisifiedBrowserFS } from './types';
import { FileSystemPromiseAdapter } from './FileSystemPromiseAdapter';
import { OverlayFSDeletedFilesLog } from './OverlayFSDeletedFilesLog';

export interface CreateBrowserFSOptions {
  gitLsTree: GitLsTreeEntry[];
  contentProvider: FileContentProvider;
  repoRoot: string;
}

/**
 * Creates the individual parts that are used to build OverlayFS
 *
 * The SourceControl system needs access to the individual parts so we
 * separate creating OverlayFS into 2 steps.
 */
export const createOverlayFSComponents = async (
  options: CreateBrowserFSOptions,
): Promise<OverlayFSOptions> => {
  // The BrowserFS modules only work when the environment is initialized.
  // This initialization should be memoized.
  initializeEnvironment();

  const readableWithCallbacks = await createAsPromise(GitLabReadableFileSystem.Create, {
    entries: createFileEntryMap(options.gitLsTree, options.repoRoot),
    contentProvider: options.contentProvider,
  });
  const readable = new FileSystemPromiseAdapter(readableWithCallbacks);

  const writableWithCallbacks = await createAsPromise(FileSystem.InMemory.Create, {});
  const writable = new FileSystemPromiseAdapter(writableWithCallbacks);
  const deletedFilesLog = new OverlayFSDeletedFilesLog(writable);

  return {
    readable,
    writable,
    deletedFilesLog,
  };
};

export const createOverlayFS = async (options: OverlayFSOptions): Promise<PromisifiedBrowserFS> => {
  const fsWithCallbacks = await createAsPromise(OverlayFS.Create, options);
  const fs = new FileSystemPromiseAdapter(fsWithCallbacks);

  return fs;
};
