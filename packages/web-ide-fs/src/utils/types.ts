import type { FileType, FileStats } from '../types';

export enum BlobContentType {
  Unloaded = 1,
  Raw = 2,
}

export interface UnloadedContent {
  type: BlobContentType.Unloaded;
  path: string;
}

export interface RawContent {
  type: BlobContentType.Raw;
  raw: Uint8Array;
}

export interface FileEntryBase extends FileStats {
  readonly name: string;
}

export interface MutableFileEntryBase extends FileEntryBase {
  mode: number;
  ctime: number;
  mtime: number;
  size: number;
}

export interface BlobEntry extends FileEntryBase {
  readonly type: FileType.Blob;
  readonly content: UnloadedContent | RawContent;
}

export interface MutableBlobEntry extends MutableFileEntryBase {
  readonly type: FileType.Blob;
  content: UnloadedContent | RawContent;
}

export interface TreeEntry extends FileEntryBase {
  readonly type: FileType.Tree;
  readonly children: string[];
}

export interface MutableTreeEntry extends MutableFileEntryBase {
  readonly type: FileType.Tree;
  children: string[];
}

export type FileEntry = BlobEntry | TreeEntry;

export type MutableFileEntry = MutableBlobEntry | MutableTreeEntry;
