import { createOverlayFSComponents, createOverlayFS } from './browserfs';
import { WebIdeFileSystemBFS } from './browserfs/WebIdeFileSystemBFS';
import { OverlaySourceControl } from './scm/OverlaySourceControl';
import { OverlaySourceControlFileSystem } from './scm/OverlaySourceControlFileSystem';
import type {
  FileContentProvider,
  GitLsTreeEntry,
  FileSystem,
  SourceControlSystem,
  SourceControlFileSystem,
} from './types';

export interface CreateSystemOptions {
  contentProvider: FileContentProvider;
  gitLsTree: GitLsTreeEntry[];
  // TODO: Rename any instance of repo.?root or repo.?path to repoRootPath
  repoRoot: string;
}

interface Systems {
  fs: FileSystem;
  sourceControl: SourceControlSystem;
  sourceControlFs: SourceControlFileSystem;
}

export const createSystems = async (options: CreateSystemOptions): Promise<Systems> => {
  const overlayFSComponents = await createOverlayFSComponents(options);
  const fs = await createOverlayFS(overlayFSComponents);

  return {
    fs: new WebIdeFileSystemBFS({
      fs,
      deletedFilesLog: overlayFSComponents.deletedFilesLog,
      repoRootPath: options.repoRoot,
    }),
    // TODO: Create sourceControl that hooks into writeable fs
    sourceControl: new OverlaySourceControl({
      ...overlayFSComponents,
      repoRootPath: options.repoRoot,
    }),
    sourceControlFs: new OverlaySourceControlFileSystem(fs, overlayFSComponents.readable),
  };
};
