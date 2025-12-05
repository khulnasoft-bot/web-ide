import { FileFlag } from 'browserfs/dist/node/core/file_flag';
import type { ReadonlyPromisifiedBrowserFS } from './types';

interface Parser<T> {
  (content: string): Promise<T>;
}

export class ParsedFileCache<T> {
  readonly #fs: ReadonlyPromisifiedBrowserFS;

  readonly #filePath: string;

  readonly #parser: Parser<T>;

  // Cache is either a tuple of (cacheKey, cacheValue) or it is empty
  #cache: [string, T] | undefined;

  constructor(fs: ReadonlyPromisifiedBrowserFS, filePath: string, parser: Parser<T>) {
    this.#fs = fs;
    this.#filePath = filePath;
    this.#parser = parser;
  }

  public async getContents(): Promise<T | null> {
    const cacheKey = await this.#getCacheKey();

    if (!cacheKey) {
      return null;
    }
    if (this.#cache && cacheKey === this.#cache[0]) {
      return this.#cache[1];
    }

    const value = await this.#parseFileContents();

    this.#cache = [cacheKey, value];

    return value;
  }

  async #getCacheKey(): Promise<string | null> {
    try {
      const stat = await this.#fs.stat(this.#filePath, null);

      // why: Using just mtime.getTime() can be flaky in some edge cases.
      //      In unit tests, sometimes the time between 2 write operations
      //      can be less than a ms which wouldn't trigger a cache invalidation.
      return `${stat.size}_${stat.mtime.getTime()}`;
    } catch {
      // The path was not found! Let's just assume empty.
      return null;
    }
  }

  async #parseFileContents(): Promise<T> {
    // We are guaranteed this is a "string" because we passed the encoding
    const content = <string>(
      await this.#fs.readFile(this.#filePath, 'utf-8', FileFlag.getFileFlag('r'))
    );

    return this.#parser(content);
  }
}
