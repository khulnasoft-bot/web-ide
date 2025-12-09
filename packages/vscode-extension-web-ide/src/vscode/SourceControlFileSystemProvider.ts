/* eslint-disable class-methods-use-this */
import type { SourceControlFileSystem } from '@khulnasoft/web-ide-fs';
import type { Disposable, FileStat, FileSystemProvider, FileType, Uri } from 'vscode';
import { fromScmUriToParams } from '../scm/uri';
import { toVSCodeFileStat } from './utils';

const noopDisposable = {
  dispose() {
    // noop
  },
};

/**
 * This FileSystemProvider is readonly and used to render content from SCM URI's
 *
 * See [VSCode's git extension][1] for how this compares.
 *
 * [1]: https://sourcegraph.com/github.com/microsoft/vscode@f4a78991ecd3e51100e2014e5c501e61ad576636/-/blob/extensions/git/src/fileSystemProvider.ts?L36:17
 */
export class SourceControlFileSystemProvider implements FileSystemProvider {
  readonly #sourceControlFs: SourceControlFileSystem;

  constructor(sourceControlFs: SourceControlFileSystem) {
    this.#sourceControlFs = sourceControlFs;
  }

  get onDidChangeFile() {
    return () => noopDisposable;
  }

  watch(): Disposable {
    return noopDisposable;
  }

  async stat(uri: Uri): Promise<FileStat> {
    const { ref, path } = fromScmUriToParams(uri);

    const result =
      ref === 'HEAD'
        ? await this.#sourceControlFs.statOriginal(path)
        : await this.#sourceControlFs.stat(path);

    return toVSCodeFileStat(result);
  }

  async readFile(uri: Uri): Promise<Uint8Array> {
    const { ref, path } = fromScmUriToParams(uri);

    const result =
      ref === 'HEAD'
        ? await this.#sourceControlFs.readFileOriginal(path)
        : await this.#sourceControlFs.readFile(path);

    return result;
  }

  // region: Unsupported methods - These methods are needed by the interface, but
  //         not actually supported by the file system, since this file system
  //         is only needed to provide content for the Source Contrl modules
  readDirectory(): [string, FileType][] | Thenable<[string, FileType][]> {
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
