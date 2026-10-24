import type { FileChangeEvent, FileStat, FileSystemProvider, FileType, Uri } from 'vscode';
import { Disposable, EventEmitter, FileSystemError, FileChangeType } from 'vscode';
import type { FileSystem } from '@khulnasoft/web-ide-fs';
import { ErrorCode } from '@khulnasoft/web-ide-fs';
import { toVSCodeFileStat, toVSCodeFileType } from './utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toVSCodeError = (err: any, msg: string): any => {
  if (!err) {
    return FileSystemError.Unavailable(`Unexpected error occurred! ${msg}`);
  }
  if (!err.code) {
    return err;
  }

  switch (err.code) {
    case ErrorCode[ErrorCode.ENOENT]:
      return FileSystemError.FileNotFound(msg);
    case ErrorCode[ErrorCode.ENOTDIR]:
      return FileSystemError.FileNotADirectory(msg);
    default:
      return err;
  }
};

export class GitLabFileSystemProvider implements FileSystemProvider, Disposable {
  readonly #onDidChangeFileEmitter: EventEmitter<FileChangeEvent[]>;

  readonly #fs: FileSystem;

  readonly #disposables: Disposable[];

  constructor(fs: FileSystem) {
    this.#disposables = [];
    this.#onDidChangeFileEmitter = new EventEmitter<FileChangeEvent[]>();
    this.#fs = fs;

    this.#disposables.push(this.#onDidChangeFileEmitter);
  }

  get onDidChangeFile() {
    return this.#onDidChangeFileEmitter.event;
  }

  // eslint-disable-next-line class-methods-use-this
  watch(): Disposable {
    // TODO: We should probably respect this at some point... But for now... We'll watch everything!

    return {
      dispose: () => null,
    };
  }

  async stat(uri: Uri): Promise<FileStat> {
    try {
      const result = await this.#fs.stat(uri.path);

      return toVSCodeFileStat(result);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      // Map any known erros to VSCode erros
      throw toVSCodeError(e, uri.path);
    }
  }

  async readDirectory(uri: Uri): Promise<[string, FileType][]> {
    try {
      const children = await this.#fs.readdirWithTypes(uri.path);

      return children.map(([name, type]) => [name, toVSCodeFileType(type)]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      // Map any known errors to VSCode errors
      throw toVSCodeError(e, uri.path);
    }
  }

  async createDirectory(uri: Uri): Promise<void> {
    try {
      await this.#fs.mkdir(uri.path);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      // Map any known errors to VSCode errors
      throw toVSCodeError(e, uri.path);
    }
  }

  async readFile(uri: Uri): Promise<Uint8Array> {
    try {
      const content = await this.#fs.readFile(uri.path);

      return content;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      throw toVSCodeError(e, uri.path);
    }
  }

  async writeFile(
    uri: Uri,
    content: Uint8Array,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options: { create: boolean; overwrite: boolean },
  ): Promise<void> {
    // TODO check options.create and options.overwrite
    try {
      await this.#fs.writeFile(uri.path, content);

      this.#onFileChange({
        type: FileChangeType.Changed,
        uri,
      });
    } catch (e: unknown) {
      throw toVSCodeError(e, uri.path);
    }
  }

  async delete(uri: Uri, options: { recursive: boolean }): Promise<void> {
    try {
      await this.#fs.rm(uri.path, { recursive: options.recursive });

      this.#onFileChange({
        type: FileChangeType.Deleted,
        uri,
      });
    } catch (e: unknown) {
      throw toVSCodeError(e, uri.path);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async rename(oldUri: Uri, newUri: Uri, options: { overwrite: boolean }): Promise<void> {
    // TODO handle overwrite

    try {
      await this.#fs.rename(oldUri.path, newUri.path);

      this.#onFileChange(
        {
          type: FileChangeType.Deleted,
          uri: oldUri,
        },
        {
          type: FileChangeType.Changed,
          uri: newUri,
        },
      );
    } catch (e: unknown) {
      throw toVSCodeError(e, oldUri.path);
    }
  }

  #onFileChange(...events: FileChangeEvent[]) {
    this.#onDidChangeFileEmitter.fire(events);
  }

  dispose() {
    Disposable.from(...this.#disposables).dispose();
  }

  // TODO handle copy
  // copy(source: Uri, target: Uri, options?: { overwrite: boolean }): void | Thenable<void> {
  //   this._fs.
  //   console.log("Copying...", source.path, target.path);

  //   if (!options?.overwrite && this._fs.getEntry(target.path)) {
  //     throw FileSystemError.FileExists(target);    return new Promise((resolve, reject) => {
  //    this._fs.readFile(path, null, FileFlag.getFileFlag('r'), (err, data) => {
  //      if (err) {
  //        reject(err);
  //      } else {
  //        resolve(<Buffer> data);
  //      }
  //    });
  //  });
  //   }
  //   if (!this._fs.getEntry(source.path)) {
  //     throw FileSystemError.FileNotFound(source);
  //   }
  //   if (!this._fs.getParentEntry(source.path)) {
  //     throw FileSystemError.FileNotFound(source.path);
  //   }

  //   this._fs.copy(source.path, target.path);
  // }
}
