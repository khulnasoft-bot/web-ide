import type { FileList } from '@khulnasoft/web-ide-fs';
import fuzzaldrinPlus from 'fuzzaldrin-plus';
import type { FileSearcher } from './types';

export class DefaultFileSearcher implements FileSearcher {
  readonly #fileList;

  constructor(fileList: FileList) {
    this.#fileList = fileList;
  }

  async searchBlobPaths(term: string, maxResults = 0): Promise<string[]> {
    const paths = await this.#fileList.listAllBlobs();

    return fuzzaldrinPlus.filter(paths, term, {
      maxResults: maxResults <= 0 ? 10 : maxResults,
    });
  }
}
