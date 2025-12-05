export enum FileType {
  Blob = 1,
  Tree = 2,
}

export interface FileStats {
  readonly mode: number;
  readonly ctime: number;
  readonly mtime: number;
  readonly size: number;
  readonly type: FileType;
}

export interface GitLsTreeEntry {
  readonly path: string;
  readonly mode: string;
}

/**
 * Responsible for providing a friendly read/write FileSystem
 *
 * We want clients of web-ide-fs to depend on this interface so
 * that we are less coupled to implementation details (like BrowserFS)
 * and the interactions are simpler.
 */
export interface FileSystem {
  stat(path: string): Promise<FileStats>;

  readdir(path: string): Promise<string[]>;

  readdirWithTypes(path: string): Promise<[string, FileType][]>;

  mkdir(path: string): Promise<void>;

  readFile(path: string): Promise<Uint8Array>;

  writeFile(path: string, data: Uint8Array): Promise<void>;

  // TODO: Remove opt: { recursive }. It isn't being used...
  rm(path: string, opt: { recursive: boolean }): Promise<void>;

  rename(oldPath: string, newPath: string): Promise<void>;

  // THOUGHT: We might want to abstract this out of this type...
  lastModifiedTime(): Promise<number>;
}

/**
 * Responsible for providing file content based on the given path
 */
export interface FileContentProvider {
  getContent(path: string): Promise<Uint8Array>;
}

export interface FileList {
  listAllBlobs(): Promise<string[]>;
}
