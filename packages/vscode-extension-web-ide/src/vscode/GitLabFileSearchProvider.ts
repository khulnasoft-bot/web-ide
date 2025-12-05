import type {
  CancellationToken,
  FileSearchOptions,
  FileSearchProvider,
  FileSearchQuery,
} from 'vscode';
import { Uri } from 'vscode';
import { FS_SCHEME } from '../constants';
import type { FileSearcher } from '../types';

export class GitLabFileSearchProvider implements FileSearchProvider {
  readonly #searcher: FileSearcher;

  readonly #repoRootPath: string;

  constructor(searcher: FileSearcher, repoRootPath: string) {
    this.#searcher = searcher;
    this.#repoRootPath = repoRootPath;
  }

  async provideFileSearchResults(
    query: FileSearchQuery,
    options: FileSearchOptions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    token: CancellationToken,
  ): Promise<Uri[]> {
    if (!query.pattern) {
      return [];
    }

    // TODO: What about the other options???
    const result = await this.#searcher.searchBlobPaths(query.pattern, options.maxResults);

    return result.map(x => Uri.joinPath(Uri.parse(`${FS_SCHEME}:/`), this.#repoRootPath, x));
  }
}
