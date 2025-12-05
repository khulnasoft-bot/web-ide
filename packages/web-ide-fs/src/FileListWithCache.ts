import type { FileList, FileSystem } from './types';

export class FileListWithCache implements FileList {
  readonly #fileList: FileList;

  readonly #fs: FileSystem;

  #cache: string[];

  #cacheKey: number | undefined;

  constructor(fileList: FileList, fs: FileSystem) {
    this.#fileList = fileList;
    this.#fs = fs;

    this.#cache = [];
    // why: initialize as undefined so that we start with an invalidated cache
    this.#cacheKey = undefined;
  }

  async listAllBlobs(): Promise<string[]> {
    return this.#updateCache();
  }

  async #updateCache(): Promise<string[]> {
    const shouldUpdate = await this.#shouldUpdateCache();

    if (!shouldUpdate) {
      return this.#cache;
    }

    this.#cache = await this.#fileList.listAllBlobs();
    this.#cacheKey = await this.#generateCacheKey();
    return this.#cache;
  }

  async #shouldUpdateCache(): Promise<boolean> {
    const newKey = await this.#generateCacheKey();

    return this.#cacheKey !== newKey;
  }

  #generateCacheKey(): Promise<number> {
    return this.#fs.lastModifiedTime();
  }
}
