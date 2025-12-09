import { splitParent, joinPaths } from '@khulnasoft/utils-path';
import type { GitLsTreeEntry } from '../types';
import { FileType } from '../types';
import type { MutableFileEntry, MutableTreeEntry, MutableBlobEntry } from './types';
import { BlobContentType } from './types';

export const ROOT_PATH = '/';

const insertRoot = (entries: Map<string, MutableFileEntry>) => {
  const root: MutableFileEntry = {
    name: ROOT_PATH,
    ctime: 0,
    mtime: 0,
    size: 0,
    mode: 0,
    type: FileType.Tree,
    children: [],
  };

  entries.set(ROOT_PATH, root);

  return root;
};

const ensureDirectory = (
  entries: Map<string, MutableFileEntry>,
  path: string | null,
): MutableTreeEntry => {
  if (!path) {
    const rootDir = entries.get(ROOT_PATH);

    if (!rootDir) {
      throw new Error('Expected root directory to exist');
    } else if (rootDir.type !== FileType.Tree) {
      throw new Error('Expected root to be directory');
    }

    return rootDir;
  }

  if (entries.has(path)) {
    // ! because we already checked .has
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const dir = entries.get(path)!;

    if (dir.type !== FileType.Tree) {
      throw new Error(`Expected path to be directory: ${path}`);
    }

    return dir;
  }

  const [parent, name] = splitParent(path);

  const parentDir = ensureDirectory(entries, parent);

  const directory: MutableFileEntry = {
    name,
    ctime: 0,
    mtime: 0,
    size: 0,
    mode: 0,
    type: FileType.Tree,
    children: [],
  };

  entries.set(path, directory);
  parentDir.children.push(path);

  return directory;
};

/**
 * Creates and inserts a new MutableBlobEntry into the given entries map
 *
 * @param entries the map of file entries we are building
 * @param path the full path of the blob to be inserted
 * @param contentPath the full path of where we should fetch content for this blob
 * @returns
 */
const insertBlob = (
  entries: Map<string, MutableFileEntry>,
  path: string,
  lsTreeEntry: GitLsTreeEntry,
): MutableFileEntry => {
  const [parent, name] = splitParent(path);

  const parentDir = ensureDirectory(entries, parent);

  const file: MutableBlobEntry = {
    name,
    ctime: 0,
    mtime: 0,
    size: 0,
    mode: parseInt(lsTreeEntry.mode, 8),
    type: FileType.Blob,
    content: {
      type: BlobContentType.Unloaded,
      path: lsTreeEntry.path,
    },
  };

  entries.set(path, file);
  parentDir.children.push(path);

  return file;
};

export const createFileEntryMap = (
  lsTreeData: GitLsTreeEntry[],
  repoRoot: string,
): Map<string, MutableFileEntry> => {
  const entries = new Map<string, MutableFileEntry>();

  // Even for empty repositories we need to have the root directory and repo root
  insertRoot(entries);
  ensureDirectory(entries, joinPaths('/', repoRoot));

  lsTreeData.forEach(treeEntry => {
    const { path } = treeEntry;
    const fullPath = joinPaths('/', repoRoot, path);

    insertBlob(entries, fullPath, treeEntry);
  });

  return entries;
};
