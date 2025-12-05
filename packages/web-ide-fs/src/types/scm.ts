import type { FileStats } from './fs';

export enum FileStatusType {
  Modified = 1,
  Created = 2,
  Deleted = 3,
}

export interface FileStatusModified {
  readonly type: FileStatusType.Modified;
  readonly path: string;
  readonly content: Buffer;
}

export interface FileStatusCreated {
  readonly type: FileStatusType.Created;
  readonly path: string;
  readonly content: Buffer;
}

export interface FileStatusDeleted {
  readonly type: FileStatusType.Deleted;
  readonly path: string;
}

export type FileStatus = FileStatusModified | FileStatusCreated | FileStatusDeleted;

/**
 * Responsible for viewing the Source Control state for the Web IDE's File System
 */
export interface SourceControlSystem {
  status(): Promise<FileStatus[]>;
}

export interface SourceControlFileSystem {
  stat(path: string): Promise<FileStats>;

  statOriginal(path: string): Promise<FileStats>;

  readFile(path: string): Promise<Uint8Array>;

  readFileOriginal(path: string): Promise<Uint8Array>;
}
