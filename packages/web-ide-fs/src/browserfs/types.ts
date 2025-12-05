import type { File } from 'browserfs/dist/node/core/file';
import type { FileFlag } from 'browserfs/dist/node/core/file_flag';
import type Stats from 'browserfs/dist/node/core/node_fs_stats';

export interface ReadonlyPromisifiedBrowserFS {
  getName(): string;
  diskSpace(p: string): Promise<{ total: number; free: number }>;
  isReadOnly(): boolean;
  supportsLinks(): boolean;
  supportsProps(): boolean;
  supportsSynch(): boolean;
  stat(p: string, isLstat: boolean | null): Promise<Stats>;
  readdir(p: string): Promise<string[]>;
  exists(p: string): Promise<boolean>;
  realpath(p: string, cache: { [path: string]: string }): Promise<string>;
  readFile(fname: string, encoding: string | null, flag: FileFlag): Promise<string | Buffer>;
  readlink(p: string): Promise<string>;
}

export interface PromisifiedBrowserFS extends ReadonlyPromisifiedBrowserFS {
  rename(oldPath: string, newPath: string): Promise<void>;
  open(p: string, flag: FileFlag, mode: number): Promise<File>;
  unlink(p: string): Promise<void>;
  rmdir(p: string): Promise<void>;
  mkdir(p: string, mode: number): Promise<void>;
  truncate(p: string, len: number): Promise<void>;
  writeFile(
    fname: string,
    data: string | Buffer,
    encoding: string | null,
    flag: FileFlag,
    mode: number,
  ): Promise<void>;
  appendFile(
    fname: string,
    data: string | Buffer,
    encoding: string | null,
    flag: FileFlag,
    mode: number,
  ): Promise<void>;
  chmod(p: string, isLchmod: boolean, mode: number): Promise<void>;
  chown(p: string, isLchown: boolean, uid: number, gid: number): Promise<void>;
  utimes(p: string, atime: Date, mtime: Date): Promise<void>;
  link(srcpath: string, dstpath: string): Promise<void>;
  symlink(srcpath: string, dstpath: string, type: string): Promise<void>;
}
