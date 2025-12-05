import { joinPaths } from '@gitlab/utils-path';
import { FileFlag } from 'browserfs/dist/node/core/file_flag';
import type { FileStats, FileSystem } from '../types';
import { FileType } from '../types';
import type { PromisifiedBrowserFS } from './types';
import type { DeletedFilesLogReadonly } from './typesOverlayFS';
import { convertToFileStats } from './utils';

export interface WebIdeFileSystemBFSOptions {
  // This is the main OverlayFS
  fs: PromisifiedBrowserFS;

  // This is the deletedFilesLog we also need to calculate The-Real-Modified-Time TM
  deletedFilesLog: DeletedFilesLogReadonly;

  // Repo root path is needed to calculate The-Real-Modified-Time TM
  repoRootPath: string;
}

export class WebIdeFileSystemBFS implements FileSystem {
  readonly #fs: PromisifiedBrowserFS;

  readonly #deletedFilesLog: DeletedFilesLogReadonly;

  readonly #repoRootPath: string;

  constructor({ fs, deletedFilesLog, repoRootPath }: WebIdeFileSystemBFSOptions) {
    this.#fs = fs;
    this.#deletedFilesLog = deletedFilesLog;
    this.#repoRootPath = repoRootPath;
  }

  async lastModifiedTime(): Promise<number> {
    const repoRootStat = await this.#fs.stat(joinPaths('/', this.#repoRootPath), false);
    const repoMTime = repoRootStat.mtime.getTime();
    const deletedMTime = await this.#deletedFilesLog.getModifiedTime();

    return Math.max(repoMTime, deletedMTime);
  }

  async stat(path: string): Promise<FileStats> {
    const stat = await this.#fs.stat(path, false);

    return convertToFileStats(stat);
  }

  readdir(path: string): Promise<string[]> {
    return this.#fs.readdir(path);
  }

  async readdirWithTypes(path: string): Promise<[string, FileType][]> {
    const children = await this.#fs.readdir(path);

    const result: Promise<[string, FileType]>[] = children.map(name => {
      const childPath = joinPaths(path, name);

      return this.stat(childPath).then(stat => [name, stat.type]);
    });

    return Promise.all(result);
  }

  mkdir(path: string): Promise<void> {
    // TODO: Is 0 for the mode really safe?
    return this.#fs.mkdir(path, 0);
  }

  async readFile(path: string): Promise<Uint8Array> {
    const content = await this.#fs.readFile(path, null, FileFlag.getFileFlag('r'));

    // We know this will be a Buffer because we passed "null" for "utf-8"
    return <Buffer>content;
  }

  writeFile(path: string, data: Uint8Array): Promise<void> {
    return this.#fs.writeFile(path, Buffer.from(data), null, FileFlag.getFileFlag('w'), 0);
  }

  rename(oldPath: string, newPath: string): Promise<void> {
    return this.#fs.rename(oldPath, newPath);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async rm(path: string, opt: { recursive: boolean }): Promise<void> {
    const stat = await this.stat(path);

    return this.#rmrf(path, stat.type);
  }

  // eslint-disable-next-line consistent-return
  async #rmrf(path: string, fileType: FileType): Promise<void> {
    if (fileType === FileType.Blob) {
      return this.#removeFile(path);
    }

    const children = await this.readdirWithTypes(path);
    const childrenRemoved = children.map(([name, type]) => {
      const childPath = joinPaths(path, name);

      return this.#rmrf(childPath, type);
    });
    await Promise.all(childrenRemoved);

    await this.#removeDir(path);
  }

  #removeDir(path: string): Promise<void> {
    return this.#fs.rmdir(path);
  }

  #removeFile(path: string): Promise<void> {
    return this.#fs.unlink(path);
  }
}
