import { splitParent } from '@khulnasoft/utils-path';
import { ApiError, ErrorCode } from 'browserfs/dist/node/core/api_error';
import type { FileFlag } from 'browserfs/dist/node/core/file_flag';
import { ActionType } from 'browserfs/dist/node/core/file_flag';
import type { BFSCallback } from 'browserfs/dist/node/core/file_system';
import { BaseFileSystem } from 'browserfs/dist/node/core/file_system';
import type { File } from 'browserfs/dist/node/core/file';
import Stats, { FileType as BrowserFSFileType } from 'browserfs/dist/node/core/node_fs_stats';
import { NoSyncFile } from 'browserfs/dist/node/generic/preload_file';
import { copyingSlice } from 'browserfs/dist/node/core/util';
import type { FileContentProvider } from '../types';
import { FileType } from '../types';
import type { FileEntry, MutableFileEntry } from '../utils';
import { BlobContentType } from '../utils';

export const DEFAULT_DATE = new Date(0);

const convertFileEntryToStats = (entry: FileEntry): Stats => {
  // TODO: let's figure out what mode should be if file type is a tree. Currently this isn't handled in `createFileEntryMap`
  const mode = entry.type === FileType.Blob ? entry.mode : undefined;
  const atime = DEFAULT_DATE;
  const mtime = atime;
  const ctime = atime;

  const stats = new Stats(
    entry.type === FileType.Blob ? BrowserFSFileType.FILE : BrowserFSFileType.DIRECTORY,
    // TODO: let's figure out what to do with size. It turns out that -1 is a flag for "use whatever fileData says"
    entry.type === FileType.Blob ? -1 : 4096,
    mode,
    atime,
    mtime,
    ctime,
  );

  if (entry.type === FileType.Tree) {
    return stats;
  }

  if (entry.content.type === BlobContentType.Raw) {
    stats.fileData = <Buffer>entry.content.raw;
    stats.size = stats.fileData.length;
  }

  return stats;
};

export interface GitLabReadableFileSystemOptions {
  entries: Map<string, MutableFileEntry>;
  contentProvider: FileContentProvider;
}

/**
 * This is a BrowserFS File System for reading from "deferred" GitLab file entries.
 *
 * See https://github.com/jvilk/BrowserFS/blob/a96aa2d417995dac7d376987839bc4e95e218e06/src/backend/HTTPRequest.ts
 * for where this implementation is inspired from.
 */
export class GitLabReadableFileSystem extends BaseFileSystem {
  public static readonly Name = 'GitLabReadableFileSystem';

  // BrowserFS likes static Create functions for these
  public static Create(
    opts: GitLabReadableFileSystemOptions,
    cb: BFSCallback<GitLabReadableFileSystem>,
  ): void {
    cb(null, new GitLabReadableFileSystem(opts.entries, opts.contentProvider));
  }

  readonly #entries: Map<string, MutableFileEntry>;

  readonly #contentProvider: FileContentProvider;

  // eslint-disable-next-line no-restricted-syntax
  private constructor(
    entries: Map<string, MutableFileEntry>,
    contentProvider: FileContentProvider,
  ) {
    super();

    this.#entries = entries;
    this.#contentProvider = contentProvider;
  }

  // eslint-disable-next-line class-methods-use-this
  public isReadOnly(): boolean {
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  public supportsLinks(): boolean {
    return false;
  }

  // eslint-disable-next-line class-methods-use-this
  public supportsProps(): boolean {
    return false;
  }

  // eslint-disable-next-line class-methods-use-this
  public supportsSynch(): boolean {
    return false;
  }

  // eslint-disable-next-line class-methods-use-this
  public getName(): string {
    return GitLabReadableFileSystem.Name;
  }

  // eslint-disable-next-line class-methods-use-this
  public diskSpace(path: string, cb: (total: number, free: number) => void): void {
    // Read-only file system. We could calculate the total space, but that's not
    // important right now.
    cb(0, 0);
  }

  // eslint-disable-next-line consistent-return
  public stat(path: string, isLstat: boolean, cb: BFSCallback<Stats>): void {
    const fileEntry = this.#entries.get(path);

    if (!fileEntry) {
      return cb(ApiError.ENOENT(path));
    }

    cb(null, convertFileEntryToStats(fileEntry));
  }

  // eslint-disable-next-line consistent-return
  public open(path: string, flags: FileFlag, mode: number, cb: BFSCallback<File>): void {
    // INVARIANT: You can't write to files on this file system.
    if (flags.isWriteable()) {
      return cb(new ApiError(ErrorCode.EPERM, path));
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    // Check if the path exists, and is a file.
    const fileEntry = this.#entries.get(path);

    if (!fileEntry) {
      return cb(ApiError.ENOENT(path));
    }

    if (fileEntry.type === FileType.Blob) {
      switch (flags.pathExistsAction()) {
        case ActionType.THROW_EXCEPTION:
        case ActionType.TRUNCATE_FILE:
          return cb(ApiError.EEXIST(path));
        case ActionType.NOP:
          // Use existing file contents.
          // XXX: Uh, this maintains the previously-used flag.
          if (fileEntry.content.type === BlobContentType.Raw) {
            const stats = convertFileEntryToStats(fileEntry);

            return cb(null, new NoSyncFile(self, path, flags, stats, stats.fileData || undefined));
          }

          this.#contentProvider
            .getContent(fileEntry.content.path)
            .then(raw => {
              // TODO do something with file size
              // fileEntry.size = ...;
              fileEntry.content = {
                type: BlobContentType.Raw,
                raw,
              };

              const stats = convertFileEntryToStats(fileEntry);

              return cb(
                null,
                new NoSyncFile(self, path, flags, stats, stats.fileData || undefined),
              );
            })
            .catch(err => cb(err));
          break;
        default:
          return cb(new ApiError(ErrorCode.EINVAL, 'Invalid FileMode object.'));
      }
    } else {
      return cb(ApiError.EISDIR(path));
    }
  }

  public readdir(path: string, cb: BFSCallback<string[]>): void {
    // Check if it exists.
    const fileEntry = this.#entries.get(path);

    if (!fileEntry) {
      cb(ApiError.ENOENT(path));
    } else if (fileEntry.type === FileType.Tree) {
      const childNames = fileEntry.children.map(x => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [parent, name] = splitParent(x);

        return name;
      });

      cb(null, childNames);
    } else {
      cb(ApiError.ENOTDIR(path));
    }
  }

  public readFile(
    fname: string,
    encoding: string,
    flag: FileFlag,
    cb: BFSCallback<string | Buffer>,
  ): void {
    // Get file.
    // eslint-disable-next-line consistent-return
    this.open(fname, flag, 0x1a4, (err: ApiError | undefined | null, fd?: File) => {
      if (err) {
        return cb(err);
      }

      const fdCast = <NoSyncFile<GitLabReadableFileSystem>>fd;
      const fdBuff = <Buffer>fdCast.getBuffer();
      if (encoding === null) {
        cb(null, copyingSlice(fdBuff));
      } else {
        try {
          const str = fdBuff.toString(<BufferEncoding>encoding);

          cb(null, str);
        } catch {
          cb(
            new ApiError(
              ErrorCode.EINVAL,
              `Could not convert buffer to string (path: ${fname}, encoding: ${encoding})`,
            ),
          );
        }
      }
    });
  }
}
