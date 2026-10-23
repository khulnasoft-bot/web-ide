import { joinPaths } from '@gitlab/utils-path';
import { FileListWithCache } from './FileListWithCache';
import type { FileList, FileSystem, SourceControlSystem } from './types';
import { FileStatusType } from './types';

interface FileListOptions {
  readonly initBlobs: string[];
  readonly sourceControl: SourceControlSystem;
}
/**
 * This provides an unordered list of all blobs from the given "fs" relative to the "repoPath"
 */
export class DefaultFileList implements FileList {
  readonly #initBlobsWithoutRoot: string[];

  readonly #sourceControl: SourceControlSystem;

  constructor({ initBlobs, sourceControl }: FileListOptions) {
    // why: We want to clone the array given to us + also make sure all paths are absolute
    this.#initBlobsWithoutRoot = initBlobs.map(x => joinPaths('/', x));
    this.#sourceControl = sourceControl;
  }

  async listAllBlobs(): Promise<string[]> {
    const status = await this.#sourceControl.status();

    const deletedFiles = new Set(
      status.filter(x => x.type === FileStatusType.Deleted).map(x => x.path),
    );
    const addedFiles = status.filter(x => x.type === FileStatusType.Created).map(x => x.path);

    return this.#initBlobsWithoutRoot.filter(x => !deletedFiles.has(x)).concat(addedFiles);
  }

  /**
   * Returns a cached version of this FileList
   *
   * @param fs used to determine if the cache needs to be invalidated
   * @returns
   */
  withCache(fs: FileSystem): FileList {
    return new FileListWithCache(this, fs);
  }
}
