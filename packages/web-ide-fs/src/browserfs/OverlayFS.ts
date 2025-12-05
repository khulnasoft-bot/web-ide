/* eslint-disable class-methods-use-this, max-classes-per-file */
/**
 * Inspired (but not copied) from https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/backend/OverlayFS.ts
 *
 * For the parts that are *very* inspired:
 *
 * ====
 *
 * Copyright (c) 2013, 2014, 2015, 2016, 2017 John Vilk and other BrowserFS contributors.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * ====
 */
import './shim';

import type { File } from 'browserfs/dist/node/core/file';
import type { FileFlag } from 'browserfs/dist/node/core/file_flag';
import type {
  BFSCallback,
  BFSOneArgCallback,
  FileSystem,
} from 'browserfs/dist/node/core/file_system';
import { BaseFileSystem } from 'browserfs/dist/node/core/file_system';
import type Stats from 'browserfs/dist/node/core/node_fs_stats';
import LockedFS from 'browserfs/dist/node/generic/locked_fs';
import PreloadFile from 'browserfs/dist/node/generic/preload_file';
import { OverlayFSImpl } from './OverlayFSImpl';
import type { DeletedFilesLog } from './typesOverlayFS';
import type { PromisifiedBrowserFS, ReadonlyPromisifiedBrowserFS } from './types';

const NAME = 'OverlayFS';

/**
 * `FileSystem` with a `sync` method that can be used by a `File`
 *
 * why: This interface is needed to prevent circular dependencies and
 *      implement `OverlayFile` which is needed to implelment FileSystem's
 *      `open(...)` interface.
 */
interface FileSystemWithSync extends FileSystem {
  sync(file: PreloadFile<FileSystemWithSync>, cb: BFSOneArgCallback): void;
}

/**
 * Overlays a read-only file to make it writable to the OverlayFS.
 *
 * Origina impl https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/backend/OverlayFS.ts#L33
 */
class OverlayFile extends PreloadFile<FileSystemWithSync> implements File {
  static createFactory(fs: FileSystemWithSync) {
    return (path: string, flag: FileFlag, stats: Stats, data: Buffer) =>
      new OverlayFile(fs, path, flag, stats, data);
  }

  sync(cb: BFSOneArgCallback): void {
    if (!this.isDirty()) {
      cb(null);
      return;
    }

    this._fs.sync(this, err => {
      this.resetDirty();
      cb(err);
    });
  }

  close(cb: BFSOneArgCallback): void {
    this.sync(cb);
  }
}

/**
 * Internal OverlayFS class that implements FileSystem interface using OverlayFSImpl
 * under-the-hood.
 * 
 * For Overlay File System behavior specifics, see [OverlayFSImpl](./OverlayFSImpl.ts).

 * ## Why split into a separate implementation class?
 *
 * The OverlayFS interface requires using callbacks. This is
 * unwieldy. Let's write a promise based implementation which we'll use
 * under-the-hood and map to callbacks in `OverlayFS.ts`.
 * 
 * Originam impl. https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/backend/OverlayFS.ts#L72
 * 
 * ## PLEASE NOTE
 * 
 * Some methods from original implementation are not included. These methods
 * are not supported by [BrowserFS's InMemoryFileSystem][0], so we can't support
 * them here:
 * 
 *   - `utimes`
 *   - `chmod`
 *   - `chown`
 * 
 * [0]: https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/generic/key_value_filesystem.ts#L265
 */
class UnlockedOverlayFS extends BaseFileSystem implements FileSystemWithSync {
  readonly #impl: OverlayFSImpl;

  constructor(
    writable: PromisifiedBrowserFS,
    deletedFilesLog: DeletedFilesLog,
    readable: ReadonlyPromisifiedBrowserFS,
  ) {
    super();

    this.#impl = new OverlayFSImpl(
      writable,
      deletedFilesLog,
      readable,
      OverlayFile.createFactory(this),
    );
  }

  getName(): string {
    return NAME;
  }

  isReadOnly(): boolean {
    return false;
  }

  supportsLinks(): boolean {
    return false;
  }

  supportsProps(): boolean {
    return this.#impl.supportsProps();
  }

  supportsSynch(): boolean {
    // why: Unlike the original implementation, let's not support the duplication of sync operations!!
    return false;
  }

  exists(p: string, cb: (exists: boolean) => void): void {
    // TODO: Generally .exists is not preferred in NodeJS file system API
    //       A race condition can happen between checking if exists and performing
    //       the actual operation.
    //       https://nodejs.org/docs/latest-v16.x/api/fs.html#fsexistspath-callback
    this.#impl.exists(p).then(
      exists => cb(exists),
      // note: this shouldn't ever happen. See above TODO.
      () => cb(false),
    );
  }

  mkdir(p: string, mode: number, cb: BFSOneArgCallback): void {
    this.#impl.mkdir(p, mode).then(
      () => cb(),
      e => cb(e),
    );
  }

  readdir(p: string, cb: BFSCallback<string[]>): void {
    this.#impl.readdir(p).then(
      x => cb(null, x),
      e => cb(e),
    );
  }

  rename(oldPath: string, newPath: string, cb: BFSOneArgCallback): void {
    this.#impl.rename(oldPath, newPath).then(
      () => cb(),
      e => cb(e),
    );
  }

  rmdir(p: string, cb: BFSOneArgCallback): void {
    this.#impl.rmdir(p).then(
      () => cb(),
      e => cb(e),
    );
  }

  stat(p: string, isLstat: boolean | null, cb: BFSCallback<Stats>): void {
    this.#impl.stat(p, isLstat).then(
      x => cb(null, x),
      e => cb(e),
    );
  }

  unlink(p: string, cb: BFSOneArgCallback): void {
    this.#impl.unlink(p).then(
      () => cb(),
      e => cb(e),
    );
  }

  open(p: string, flag: FileFlag, mode: number, cb: BFSCallback<File>): void {
    this.#impl.open(p, flag, mode).then(
      file => cb(null, file),
      e => cb(e),
    );
  }

  sync(file: PreloadFile<FileSystemWithSync>, cb: BFSOneArgCallback): void {
    this.#impl.sync(file).then(
      () => cb(),
      e => cb(e),
    );
  }
}

/**
 * Configuration options for OverlayFS instances.
 *
 * Original impl. https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/backend/OverlayFS.ts#L977
 */
export interface OverlayFSOptions {
  // The file system to write modified files to.
  writable: PromisifiedBrowserFS;

  // The interface for keeping track of deleted files
  deletedFilesLog: DeletedFilesLog;

  // The file system that initially populates this file system.
  readable: ReadonlyPromisifiedBrowserFS;
}

/**
 * OverlayFS makes a read-only filesystem writable by storing writes on a second,
 * writable file system. Deletes are persisted via metadata stored on the writable
 * file system.
 *
 * Original impl. https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/backend/OverlayFS.ts#L989
 */
export default class OverlayFS extends LockedFS<UnlockedOverlayFS> {
  /**
   * Constructs and initializes an OverlayFS instance with the given options.
   */
  public static Create(opts: OverlayFSOptions, cb: BFSCallback<OverlayFS>): void {
    const fs = new OverlayFS(opts.writable, opts.deletedFilesLog, opts.readable);
    cb(null, fs);
  }

  // eslint-disable-next-line no-restricted-syntax
  private constructor(
    writable: PromisifiedBrowserFS,
    deletedFilesLog: DeletedFilesLog,
    readable: ReadonlyPromisifiedBrowserFS,
  ) {
    super(new UnlockedOverlayFS(writable, deletedFilesLog, readable));
  }
}
