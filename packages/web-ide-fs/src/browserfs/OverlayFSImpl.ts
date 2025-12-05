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
 *
 */
import { joinPaths, dirname } from '@gitlab/utils-path';
import { ApiError, ErrorCode } from 'browserfs/dist/node/core/api_error';
import type { File } from 'browserfs/dist/node/core/file';
import { ActionType, FileFlag } from 'browserfs/dist/node/core/file_flag';
import type { FileSystem } from 'browserfs/dist/node/core/file_system';
import type Stats from 'browserfs/dist/node/core/node_fs_stats';
import type PreloadFile from 'browserfs/dist/node/generic/preload_file';
import { uniq } from 'lodash';
import { MODE_WRITABLE } from '../constants';
import type { PromisifiedBrowserFS, ReadonlyPromisifiedBrowserFS } from './types';
import type { DeletedFilesLog } from './typesOverlayFS';
import { mkdirp, readdirOrEmpty } from './utils';

/**
 * Given a read-only mode, makes it writable.
 * @hidden
 */
const makeModeWritable = (mode: number): number =>
  // Original impl https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/backend/OverlayFS.ts#L19
  // eslint-disable-next-line no-bitwise
  MODE_WRITABLE | mode;

/**
 * Implementation class for the OverlayFS business logic
 *
 * ## Why split into a separate implementation class?
 *
 * The OverlayFS interface requires using callbacks. This is
 * unwieldy. Let's write a promise based implementation which we'll use
 * under-the-hood and map to callbacks in `OverlayFS.ts`.
 *
 * ## Diagram:
 *
 *   - Writable contains the most up-to-date changes
 *   - If something doesn't exist on writable, next SSOT is writable's
 *     `deletedFiles.log`. `deletedFiles.log` tells us what we can ignore
 *     from readable.
 *   - Then fallback to readable
 *
 * ```
 *                             |
 *                             |
 *                             ↓
 *    ----------------------------------------------------------
 *   |                      writable                            |
 *    ----------------------------------------------------------
 *                             |
 *                             |
 *                             ↓
 *                 -------------------------
 *                \ deleted (based on log)? /
 *                   --------------------
 *                             |
 *                             |
 *                             ↓
 *    ----------------------------------------------------------
 *   |                      readable                            |
 *    ----------------------------------------------------------
 *
 * ```
 *
 * ### Read Strategy
 *
 * - Try writable FileSystem
 * - Try .deletedFiles.log in writiable
 * - Try readable FileSystem
 *
 * ### Write Strategy
 *
 * - Write straight to writable FileSystem
 *
 * ### Delete Strategy
 *
 * - Make sure deleted from writable
 * - If exists in readable, update .deletedFiles.log in writable
 * - If directory, just store directory in log. Don't expand to files. This way we can
 *   keep track if the actual folder itself is deleted or not.
 *   This will help prevent issues like https://gitlab.com/gitlab-org/gitlab-web-ide/-/merge_requests/83#note_1178993649
 */
export class OverlayFSImpl {
  readonly #writable: PromisifiedBrowserFS;

  readonly #readable: ReadonlyPromisifiedBrowserFS;

  readonly #deletedFiles: DeletedFilesLog;

  readonly #createOverlayFile: (path: string, flag: FileFlag, stats: Stats, data: Buffer) => File;

  constructor(
    writable: PromisifiedBrowserFS,
    deletedFilesLog: DeletedFilesLog,
    readable: ReadonlyPromisifiedBrowserFS,
    createOverlayFile: (path: string, flag: FileFlag, stats: Stats, data: Buffer) => File,
  ) {
    this.#writable = writable;
    this.#readable = readable;

    // why: This is needed in the `open()` method. File needs a reference to
    //      the original callback based BrowserFS FileSystem, so we can't simply
    //      create a File here.
    this.#createOverlayFile = createOverlayFile;

    this.#deletedFiles = deletedFilesLog;

    if (this.#writable.isReadOnly()) {
      throw new ApiError(ErrorCode.EINVAL, 'Writable file system must be writable.');
    }
  }

  supportsProps(): boolean {
    return this.#readable.supportsProps() && this.#writable.supportsProps();
  }

  async exists(p: string): Promise<boolean> {
    if (await this.#existsInWritable(p)) {
      return true;
    }

    return this.#existsInReadable(p);
  }

  async mkdir(p: string, mode: number): Promise<void> {
    // Original https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/backend/OverlayFS.ts#L596
    // See "Write Strategy" in class description
    this.#throwIfProtectedPath(p);

    if (await this.exists(p)) {
      throw ApiError.EEXIST(p);
    }

    return mkdirp(this.#writable, p, mode);
  }

  async readdir(p: string): Promise<string[]> {
    // Original impl https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/backend/OverlayFS.ts#L628
    // See "Read Strategy" in class description
    const stat = await this.stat(p, false);

    if (!stat.isDirectory()) {
      throw ApiError.ENOTDIR(p);
    }

    const wfiles = await readdirOrEmpty(this.#writable, p);

    // If this path is deleted, we can short circuit and just return files from writable
    if (await this.#deletedFiles.isDeleted(p)) {
      return wfiles;
    }

    const rfilesFilteredAsync = (await readdirOrEmpty(this.#readable, p)).map(async file => {
      // If the readable child is deleted, don't include
      const isDeleted = await this.#deletedFiles.isDeleted(joinPaths(p, file));

      return isDeleted ? [] : [file];
    });
    const rfiles = (await Promise.all(rfilesFilteredAsync)).flatMap(x => x);

    return uniq([...wfiles, ...rfiles]);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    // Original impl https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/backend/OverlayFS.ts#L178
    // See "Write Strategy" and "Delete Strategy" in class description
    this.#throwIfProtectedPath(oldPath);
    this.#throwIfProtectedPath(newPath);

    const oldExistsInWritable = await this.#existsInWritable(oldPath);
    const oldExistsInReadable = await this.#existsInReadable(oldPath);
    const oldExists = oldExistsInReadable || oldExistsInWritable;

    if (!oldExists) {
      throw ApiError.ENOENT(oldPath);
    }
    if (oldPath === newPath) {
      return;
    }
    if (await this.exists(newPath)) {
      throw ApiError.EEXIST(newPath);
    }

    // what: Optimistically prep newPath directory in writable FS
    // why: Without this we could run into errors renaming oldPath to newPath
    await mkdirp(this.#writable, dirname(newPath));

    const stat = await this.stat(oldPath, false);

    if (stat.isFile()) {
      // condition: isFile and already exist in writable
      // then: we can simply rename
      if (oldExistsInWritable) {
        await this.#writable.rename(oldPath, newPath);
      }
      // condition: isFile and exist **only** in readable
      // then: we have to write the readable content into writable
      else {
        const content = await this.#readable.readFile(oldPath, null, FileFlag.getFileFlag('r'));

        await this.#writable.writeFile(
          newPath,
          content,
          null,
          FileFlag.getFileFlag('w'),
          makeModeWritable(stat.mode),
        );
      }

      // what: Add deleted record if oldPath exists in readable
      if (oldExistsInReadable) {
        await this.#deletedFiles.append('file', oldPath);
      }

      return;
    }

    // condition: oldPath isDirectory and exists in readable
    // then: we need to move any missing children over to writable
    if (oldExistsInReadable) {
      await this.#copyFromReadableToWritable(oldPath, { includeChildren: true });
    }

    await this.#writable.rename(oldPath, newPath);

    // what: Add deleted record if oldPath exists in readable
    if (oldExistsInReadable) {
      await this.#deletedFiles.append('dir', oldPath);
    }
  }

  async rmdir(p: string): Promise<void> {
    // Original impl https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/backend/OverlayFS.ts#L530
    // See "Delete Strategy" in class description
    if (!(await this.exists(p))) {
      throw ApiError.ENOENT(p);
    }

    if (await this.#existsInWritable(p)) {
      await this.#writable.rmdir(p);
    }

    if (await this.#existsInReadable(p)) {
      await this.#deletedFiles.append('dir', p);
    }
  }

  async stat(p: string, isLstat: boolean | null): Promise<Stats> {
    // Original impl https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/backend/OverlayFS.ts#L350
    // See "Read Strategy" in class description
    try {
      const writableStat = await this.#writable.stat(p, isLstat);

      return writableStat;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      // ENOENT is the only expected possible error. So if we got something else, let's panic.
      if (e?.errno !== ErrorCode.ENOENT) {
        throw e;
      }
    }

    // Otherwise, let's check out readable
    if (!(await this.#existsInReadable(p))) {
      throw ApiError.ENOENT(p);
    }

    const readableStat = await this.#readable.stat(p, isLstat);
    const stat = readableStat.clone();
    stat.mode = makeModeWritable(stat.mode);

    return stat;
  }

  async unlink(p: string): Promise<void> {
    // Original impl https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/backend/OverlayFS.ts#L480
    // See "Delete Strategy" in class description
    if (!(await this.exists(p))) {
      throw ApiError.ENOENT(p);
    }

    if (await this.#existsInReadable(p)) {
      await this.#deletedFiles.append('file', p);
    }

    if (await this.#existsInWritable(p)) {
      await this.#writable.unlink(p);
    }
  }

  async open(p: string, flag: FileFlag, mode: number): Promise<File> {
    // Original impl https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/backend/OverlayFS.ts#L395
    // See "Write Strategy" in class description
    this.#throwIfProtectedPath(p);

    if (!(await this.exists(p))) {
      if (flag.pathNotExistsAction() === ActionType.CREATE_FILE) {
        await mkdirp(this.#writable, dirname(p));
        return this.#writable.open(p, flag, mode);
      }

      throw ApiError.ENOENT(p);
    }

    const action = flag.pathExistsAction();

    if (action === ActionType.TRUNCATE_FILE) {
      await mkdirp(this.#writable, dirname(p));
      return this.#writable.open(p, flag, mode);
    }

    if (action === ActionType.NOP) {
      const existsInWritable = await this.#writable.exists(p);

      if (existsInWritable) {
        return this.#writable.open(p, flag, mode);
      }

      const stats = await this.#readable.stat(p, false);
      stats.mode = mode;

      // We know this is a Buffer since we passed "null" encoding
      const content = <Buffer>await this.#readable.readFile(p, null, FileFlag.getFileFlag('r'));

      if (stats.size === -1) {
        stats.size = content.length;
      }

      return this.#createOverlayFile(p, flag, stats, content);
      // const f = new OverlayFile(this, p, flag, stats!, data);
      // cb(null, f);
    }

    throw ApiError.EEXIST(p);
  }

  // why: We have to use "T" since we don't know what kind of FileSystem we have at this point.
  //      Thankfully, we don't need to. We're not trying to conform to any interface here, just
  //      providing business logic implementation for the actual thing that will implement FileSystem.
  async sync<T extends FileSystem>(file: PreloadFile<T>): Promise<void> {
    // Original impl https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/backend/OverlayFS.ts#L107
    // See "Write Strategy" in class description
    await mkdirp(this.#writable, dirname(file.getPath()));

    await this.#writable.writeFile(
      file.getPath(),
      file.getBuffer(),
      null,
      FileFlag.getFileFlag('w'),
      file.getStats().mode,
    );
  }

  // region: Privates --------------------------------------------------

  /**
   * Check that the path is not prohibited from changes (e.g. the delete files log)
   */
  #throwIfProtectedPath(p: string): void {
    if (p === this.#deletedFiles.path) {
      throw ApiError.EPERM(p);
    }
  }

  async #copyFromReadableToWritable(p: string, options = { includeChildren: false }) {
    // Assumes `p` exists in readable
    const readableStat = await this.#readable.stat(p, false);
    const mode = makeModeWritable(readableStat.mode);
    const writableExists = await this.#writable.exists(p);

    // If not directory, just copy over...
    if (readableStat?.isFile() && !writableExists) {
      const contents = await this.#readable.readFile(p, null, FileFlag.getFileFlag('r'));
      await mkdirp(this.#writable, dirname(p));
      await this.#writable.writeFile(p, contents, null, FileFlag.getFileFlag('w'), mode);
      return;
    }

    // Mkdir if we need to
    if (!writableExists) {
      await mkdirp(this.#writable, p);
    }

    if (options.includeChildren) {
      const children = await this.#readable.readdir(p);

      await Promise.all(
        children.map(async childName => {
          const childPath = joinPaths(p, childName);

          if (await this.#deletedFiles.isDeleted(childPath)) {
            return;
          }

          await this.#copyFromReadableToWritable(childPath, options);
        }),
      );
    }
  }

  /**
   * Returns true if the path exists in the writable file system.
   */
  async #existsInWritable(p: string): Promise<boolean> {
    return this.#writable.exists(p);
  }

  /**
   * Returns true if the path is in the readable file system **and**
   * hasn't been deleted.
   */
  async #existsInReadable(p: string): Promise<boolean> {
    const isPresent = await this.#readable.exists(p);

    if (!isPresent) {
      return false;
    }

    const isDeleted = await this.#deletedFiles.isDeleted(p);

    return !isDeleted;
  }
}
