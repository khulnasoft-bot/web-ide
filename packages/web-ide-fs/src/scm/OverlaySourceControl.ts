import { joinPaths } from '@khulnasoft/utils-path';
import { mapKeys } from 'lodash';
import { FileFlag } from 'browserfs/dist/node/core/file_flag';
import { existsAsFile, readAllFiles } from '../browserfs/utils';
import type { FileStatus, SourceControlSystem } from '../types';
import { FileStatusType } from '../types';
import type { ReadonlyPromisifiedBrowserFS } from '../browserfs/types';
import type { DeletedFilesLogReadonly } from '../browserfs/typesOverlayFS';
import { readdirRecursive } from '../browserfs/utils/readdirRecursive';

interface OverlaySourceControlOptions {
  readonly writable: ReadonlyPromisifiedBrowserFS;
  readonly readable: ReadonlyPromisifiedBrowserFS;
  readonly deletedFilesLog: DeletedFilesLogReadonly;
  readonly repoRootPath: string;
}

export class OverlaySourceControl implements SourceControlSystem {
  readonly #readableFS: ReadonlyPromisifiedBrowserFS;

  readonly #writableFS: ReadonlyPromisifiedBrowserFS;

  readonly #deletedFilesLog: DeletedFilesLogReadonly;

  readonly #repoRootPath: string;

  constructor(opt: OverlaySourceControlOptions) {
    this.#readableFS = opt.readable;
    this.#writableFS = opt.writable;
    this.#deletedFilesLog = opt.deletedFilesLog;

    // Force leading slash
    this.#repoRootPath = joinPaths('/', opt.repoRootPath);
  }

  async status(): Promise<FileStatus[]> {
    // 1. Read `deletedFiles`. Treat each entry as "deleted" file statuses.
    // 2. Recursively read all files in the `repoRootPath` in `writable`. For each file:
    //     a. If file was assumed to be deleted (based on `.deletedFiles.log`), remove "deleted" file status.
    //     b. If file does not exist in `readable`, add "new" file status.
    //     c. ElseIf `writable` file content is different than `readable` file content, add "modified" file status.
    // 3. Return statuses.

    // Step 1
    const deletedFilesLog = await this.#getDeletedFilesLog();

    // Step 2
    const touchedRepoFiles = await this.#readAllWritableRepoFiles();
    const allTouchedPaths = new Set(Object.keys(touchedRepoFiles));
    const touchedStatuses = await this.#processTouchedRepoFiles(touchedRepoFiles);

    const deletedStatuses: FileStatus[] = deletedFilesLog
      .filter(deletedPath => !allTouchedPaths.has(deletedPath))
      .map(path => ({
        type: FileStatusType.Deleted,
        path,
      }));

    const statuses: FileStatus[] = [...deletedStatuses, ...touchedStatuses];

    return statuses;
  }

  async #processTouchedRepoFiles(touchedRepoFiles: Record<string, Buffer>): Promise<FileStatus[]> {
    const newStatuses = await Promise.all(
      Object.entries(touchedRepoFiles).map(([path, content]) =>
        this.#processTouchedRepoFile(path, content),
      ),
    );

    return newStatuses.flatMap(x => x);
  }

  async #processTouchedRepoFile(path: string, content: Buffer): Promise<FileStatus[]> {
    //     b. If file does not exist in `readable`, add "new" file status.
    //     c. ElseIf `writable` file content is different than `readable` file content, add "modified" file status.
    const fullPath = joinPaths(this.#repoRootPath, path);

    const existsInReadable = await existsAsFile(fullPath, this.#readableFS);

    if (!existsInReadable) {
      return [
        {
          type: FileStatusType.Created,
          path,
          content,
        },
      ];
    }

    const hasChanged = await this.#fileContentHasChanged(fullPath, content);

    if (hasChanged) {
      return [
        {
          type: FileStatusType.Modified,
          path,
          content,
        },
      ];
    }

    return [];
  }

  async #fileContentHasChanged(fullPath: string, content: Buffer): Promise<boolean> {
    // We can assume that the repo path exists here...
    // We also know this is a Buffer because we do not pass encoding
    const oldContent = <Buffer>(
      await this.#readableFS.readFile(fullPath, null, FileFlag.getFileFlag('r'))
    );

    return !content.equals(oldContent);
  }

  async #readAllWritableRepoFiles(): Promise<Record<string, Buffer>> {
    const hasRepoFiles = await this.#writableFS.exists(this.#repoRootPath);

    if (!hasRepoFiles) {
      return {};
    }

    const result = await readAllFiles(this.#writableFS, this.#repoRootPath);

    return mapKeys(result, (value, key) => this.#cleanRepoFilePath(key));
  }

  async #getDeletedFilesLog(): Promise<string[]> {
    const contents = await this.#deletedFilesLog.getContents();

    if (!contents) {
      return [];
    }

    // what: From `contents.directories`, read all the files that we should consider deleted
    const deletedDirectories = Array.from(contents.directories.keys());
    const deletedDirectoriesFiles = await Promise.all(
      deletedDirectories.map(dir => readdirRecursive(this.#readableFS, dir)),
    );
    const deletedFiles = new Set(deletedDirectoriesFiles.flatMap(x => x));

    // what: From `contents.files`, add the remaining files to our set
    contents.files.forEach(x => deletedFiles.add(x));

    return Array.from(deletedFiles).map(path => this.#cleanRepoFilePath(path));
  }

  #cleanRepoFilePath(entry: string): string {
    if (entry.startsWith(this.#repoRootPath)) {
      return entry.slice(this.#repoRootPath.length);
    }

    return entry;
  }
}
