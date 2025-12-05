/* eslint-disable class-methods-use-this */
import type { FileContentProvider } from '@gitlab/web-ide-fs';
import * as vscode from 'vscode';

const noopDisposable = {
  dispose() {
    // noop
  },
};

/**
 * An adapter for our FileContentProvider to vscode.FileSystemProvider
 */
export class GitLabReadonlyFileSystemProvider implements vscode.FileSystemProvider {
  readonly #fileContentProvider: FileContentProvider;

  constructor(fileContentProvider: FileContentProvider) {
    this.#fileContentProvider = fileContentProvider;
  }

  readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
    return this.#fileContentProvider.getContent(uri.path);
  }

  stat(): vscode.FileStat {
    return {
      ctime: 0,
      mtime: 0,
      size: -1,
      type: vscode.FileType.File,
    };
  }

  get onDidChangeFile() {
    return () => noopDisposable;
  }

  watch(): vscode.Disposable {
    return noopDisposable;
  }

  // region: Unsupported methods - These methods are needed by the interface, but
  //         not actually supported by the file system, since this file system
  //         is only needed to provide content for the Source Contrl modules

  readDirectory(): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
    throw new Error('Method not implemented.');
  }

  createDirectory(): void | Thenable<void> {
    throw new Error('Method not implemented.');
  }

  writeFile(): void | Thenable<void> {
    throw new Error('Method not implemented.');
  }

  delete(): void | Thenable<void> {
    throw new Error('Method not implemented.');
  }

  rename(): void | Thenable<void> {
    throw new Error('Method not implemented.');
  }
}
