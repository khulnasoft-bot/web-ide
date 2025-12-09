import type { FileContentProvider } from '@khulnasoft/web-ide-fs';
import { stripPathRoot } from '../stripPathRoot';

/**
 * Decorator for FileContentProvider that strips repo root from calls to getContent
 */
export class FileContentProviderWithRepoRoot implements FileContentProvider {
  readonly #base: FileContentProvider;

  readonly #repoRoot: string;

  constructor(base: FileContentProvider, repoRoot: string) {
    this.#base = base;
    this.#repoRoot = repoRoot;
  }

  getContent(path: string): Promise<Uint8Array> {
    return this.#base.getContent(stripPathRoot(path, this.#repoRoot));
  }
}
