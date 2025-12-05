import { FileFlag } from 'browserfs/dist/node/core/file_flag';
import type { ReadonlyPromisifiedBrowserFS } from '../browserfs/types';
import { convertToFileStats } from '../browserfs/utils';
import type { FileStats, SourceControlFileSystem } from '../types';

export class OverlaySourceControlFileSystem implements SourceControlFileSystem {
  readonly #fs: ReadonlyPromisifiedBrowserFS;

  readonly #originalFs: ReadonlyPromisifiedBrowserFS;

  constructor(fs: ReadonlyPromisifiedBrowserFS, originalFs: ReadonlyPromisifiedBrowserFS) {
    this.#fs = fs;
    this.#originalFs = originalFs;
  }

  async stat(path: string): Promise<FileStats> {
    const stat = await this.#fs.stat(path, false);

    return convertToFileStats(stat);
  }

  async statOriginal(path: string): Promise<FileStats> {
    const stat = await this.#originalFs.stat(path, false);

    return convertToFileStats(stat);
  }

  async readFile(path: string): Promise<Uint8Array> {
    // We know this will be a Buffer because we passed "null" for "utf-8"
    return <Buffer>await this.#fs.readFile(path, null, FileFlag.getFileFlag('r'));
  }

  async readFileOriginal(path: string): Promise<Uint8Array> {
    // We know this will be a Buffer because we passed "null" for "utf-8"
    return <Buffer>await this.#originalFs.readFile(path, null, FileFlag.getFileFlag('r'));
  }
}
