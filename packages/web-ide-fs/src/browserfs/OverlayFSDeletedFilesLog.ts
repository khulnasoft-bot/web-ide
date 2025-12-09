import { PATH_ROOT, dirname, cleanEndingSeparator } from '@khulnasoft/utils-path';
import { FileFlag } from 'browserfs/dist/node/core/file_flag';
import { MODE_DEFAULT } from '../constants';
import { ParsedFileCache } from './ParsedFileCache';
import type { PromisifiedBrowserFS } from './types';
import type {
  DeletedFilesLineType,
  DeletedFilesLog,
  DeletedFilesLogContents,
} from './typesOverlayFS';

const DEFAULT_PATH = '/.deletedFiles.log';
const DELETED_FILES_LOG_LINE_REGEX = /^(?<type>file|dir):(?<path>.*)$/;

/**
 * Parses the raw file content into a DeletedFilesLog
 */
const parseDeletedFileLog = async (content: string): Promise<DeletedFilesLogContents> => {
  const files = new Set<string>();
  const directories = new Set<string>();

  content.split(/\r?\n/).forEach(line => {
    const regexMatch = line.match(DELETED_FILES_LOG_LINE_REGEX);

    if (!regexMatch?.groups) {
      return;
    }

    const { type, path } = regexMatch.groups as { type: DeletedFilesLineType; path: string };

    if (type === 'file') {
      files.add(path);
    } else if (type === 'dir') {
      directories.add(path);
    }
  });

  return {
    files,
    directories,
  };
};

/**
 * Manages updating and evaluating if a path is deleted based on the DeletedFileLog
 * stored in the given FileSystem.
 */
export class OverlayFSDeletedFilesLog implements DeletedFilesLog {
  readonly #writableFs: PromisifiedBrowserFS;

  readonly #path: string;

  readonly #contentsCache: ParsedFileCache<DeletedFilesLogContents>;

  constructor(writableFs: PromisifiedBrowserFS, path: string = DEFAULT_PATH) {
    this.#writableFs = writableFs;
    this.#path = path;

    this.#contentsCache = new ParsedFileCache<DeletedFilesLogContents>(
      this.#writableFs,
      this.#path,
      parseDeletedFileLog,
    );
  }

  get path() {
    return this.#path;
  }

  getContents() {
    return this.#contentsCache.getContents();
  }

  async getModifiedTime(): Promise<number> {
    const hasDeletedFiles = await this.#writableFs.exists(this.#path);

    if (!hasDeletedFiles) {
      return -1;
    }

    const stat = await this.#writableFs.stat(this.#path, false);

    return stat.mtime.getTime();
  }

  async append(type: DeletedFilesLineType, pathArg: string) {
    // TODO: When we delete a directory, we can optimize things like removing redundant records
    const path = cleanEndingSeparator(pathArg.replace(/\r?\n/g, ''));

    await this.#writableFs.appendFile(
      this.#path,
      `${type}:${path}\n`,
      'utf-8',
      FileFlag.getFileFlag('a'),
      MODE_DEFAULT,
    );
  }

  async isDeleted(pathArg: string): Promise<boolean> {
    const path = cleanEndingSeparator(pathArg);
    const log = await this.getContents();

    if (!log) {
      return false;
    }

    if (log.files.has(path) || log.directories.has(path)) {
      return true;
    }

    // TODO: Optimize based on number of deleted directories *and* number of slashes in path
    let currentPath = dirname(path);
    while (currentPath && currentPath !== PATH_ROOT) {
      if (log.directories.has(currentPath)) {
        return true;
      }

      currentPath = dirname(currentPath);
    }

    return false;
  }
}
