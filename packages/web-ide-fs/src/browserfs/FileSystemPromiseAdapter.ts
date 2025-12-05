import type { File } from 'browserfs/dist/node/core/file';
import type { FileFlag } from 'browserfs/dist/node/core/file_flag';
import type { FileSystem } from 'browserfs/dist/node/core/file_system';
import type Stats from 'browserfs/dist/node/core/node_fs_stats';
import type { PromisifiedBrowserFS } from './types';

export class FileSystemPromiseAdapter implements PromisifiedBrowserFS {
  readonly #fs: FileSystem;

  constructor(fs: FileSystem) {
    this.#fs = fs;
  }

  getName(): string {
    return this.#fs.getName();
  }

  diskSpace(p: string): Promise<{ total: number; free: number }> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, reject) => {
      this.#fs.diskSpace(p, (total, free) => resolve({ total, free }));
    });
  }

  isReadOnly(): boolean {
    return this.#fs.isReadOnly();
  }

  supportsLinks(): boolean {
    return this.#fs.supportsLinks();
  }

  supportsProps(): boolean {
    return this.#fs.supportsProps();
  }

  supportsSynch(): boolean {
    return this.#fs.supportsSynch();
  }

  rename(oldPath: string, newPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#fs.rename(oldPath, newPath, e => {
        if (e) {
          reject(e);
        } else {
          resolve();
        }
      });
    });
  }

  stat(p: string, isLstat: boolean | null): Promise<Stats> {
    return new Promise((resolve, reject) => {
      this.#fs.stat(p, isLstat, (e, stat) => {
        if (!stat) {
          reject(e);
        } else {
          resolve(stat);
        }
      });
    });
  }

  open(p: string, flag: FileFlag, mode: number): Promise<File> {
    return new Promise((resolve, reject) => {
      this.#fs.open(p, flag, mode, (e, file) => {
        if (!file) {
          reject(e);
        } else {
          resolve(file);
        }
      });
    });
  }

  unlink(p: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#fs.unlink(p, e => {
        if (e) {
          reject(e);
        } else {
          resolve();
        }
      });
    });
  }

  rmdir(p: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#fs.rmdir(p, e => {
        if (e) {
          reject(e);
        } else {
          resolve();
        }
      });
    });
  }

  mkdir(p: string, mode: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#fs.mkdir(p, mode, e => {
        if (e) {
          reject(e);
        } else {
          resolve();
        }
      });
    });
  }

  readdir(p: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.#fs.readdir(p, (e, children) => {
        if (!children) {
          reject(e);
        } else {
          resolve(children);
        }
      });
    });
  }

  exists(p: string): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, reject) => {
      this.#fs.exists(p, resolve);
    });
  }

  realpath(p: string, cache: { [path: string]: string }): Promise<string> {
    return new Promise((resolve, reject) => {
      this.#fs.realpath(p, cache, (e, result) => {
        if (result === undefined) {
          reject(e);
        } else {
          resolve(result);
        }
      });
    });
  }

  truncate(p: string, len: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#fs.truncate(p, len, e => {
        if (e) {
          reject(e);
        } else {
          resolve();
        }
      });
    });
  }

  readFile(fname: string, encoding: string | null, flag: FileFlag): Promise<string | Buffer> {
    return new Promise((resolve, reject) => {
      this.#fs.readFile(fname, encoding, flag, (e, result) => {
        if (result === undefined) {
          reject(e);
        } else {
          resolve(result);
        }
      });
    });
  }

  writeFile(
    fname: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    encoding: string | null,
    flag: FileFlag,
    mode: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#fs.writeFile(fname, data, encoding, flag, mode, e => {
        if (e) {
          reject(e);
        } else {
          resolve();
        }
      });
    });
  }

  appendFile(
    fname: string,
    data: string | Buffer,
    encoding: string | null,
    flag: FileFlag,
    mode: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#fs.appendFile(fname, data, encoding, flag, mode, e => {
        if (e) {
          reject(e);
        } else {
          resolve();
        }
      });
    });
  }

  chmod(p: string, isLchmod: boolean, mode: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#fs.chmod(p, isLchmod, mode, e => {
        if (e) {
          reject(e);
        } else {
          resolve();
        }
      });
    });
  }

  chown(p: string, isLchown: boolean, uid: number, gid: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#fs.chown(p, isLchown, uid, gid, e => {
        if (e) {
          reject(e);
        } else {
          resolve();
        }
      });
    });
  }

  utimes(p: string, atime: Date, mtime: Date): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#fs.utimes(p, atime, mtime, e => {
        if (e) {
          reject(e);
        } else {
          resolve();
        }
      });
    });
  }

  link(srcpath: string, dstpath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#fs.link(srcpath, dstpath, e => {
        if (e) {
          reject(e);
        } else {
          resolve();
        }
      });
    });
  }

  symlink(srcpath: string, dstpath: string, type: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#fs.symlink(srcpath, dstpath, type, e => {
        if (e) {
          reject(e);
        } else {
          resolve();
        }
      });
    });
  }

  readlink(p: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.#fs.readlink(p, (e, result) => {
        if (result === undefined) {
          reject(e);
        } else {
          resolve(result);
        }
      });
    });
  }
}
