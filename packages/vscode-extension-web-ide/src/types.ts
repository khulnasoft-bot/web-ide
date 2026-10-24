import type * as vscode from 'vscode';
import type { StartCommandResponse } from '@khulnasoft/vscode-mediator-commands';

interface UnloadedContent {
  type: 'unloaded';
  path: string;
}

interface RawContent {
  type: 'raw';
  raw: Uint8Array;
}

export interface FileEntry {
  readonly type: 'blob' | 'tree';
  readonly name: string;
  readonly ctime: number;
  readonly mtime: number;
  readonly size: number;
  readonly children?: string[];
  readonly content?: UnloadedContent | RawContent;
  // The hash of the initially loaded content
  readonly initContentHash?: string;
}

export interface MutableFileEntry extends FileEntry {
  ctime: number;
  mtime: number;
  size: number;
  children?: string[];
  content?: UnloadedContent | RawContent;
  initContentHash?: string;
}

export interface FileSystem {
  getEntry(path: string): FileEntry | undefined;
  getParentEntry(path: string): FileEntry | undefined;
  writeFile(path: string, content: Uint8Array): void;
  saveLoadedContent(path: string, content: Uint8Array): FileEntry;
  createFile(path: string, content?: Uint8Array): void;
  createDirectory(path: string): void;
  delete(path: string): void;
  rename(oldPath: string, newPath: string): void;
  copy(sourcePath: string, targetPath: string): void;
}

export type LocalStorage = vscode.Memento;

export interface FileSearcher {
  searchBlobPaths(term: string, maxResults?: number): Promise<string[]>;
}

export type CommandsInitialData = Pick<
  StartCommandResponse,
  'gitlabUrl' | 'project' | 'ref' | 'userPermissions'
>;

export type NonReloadInitializeOptions = {
  ref?: string;
  isReload: false;
  pageReload: false;
};

export type ReloadInitializeOptions = {
  isReload: true;
  ref: string;
  projectPath: string;
  pageReload: boolean;
};

export type InitializeOptions = ReloadInitializeOptions | NonReloadInitializeOptions;
