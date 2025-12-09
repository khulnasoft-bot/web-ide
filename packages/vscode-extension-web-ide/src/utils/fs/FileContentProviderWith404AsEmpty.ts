import type { FileContentProvider } from '@khulnasoft/web-ide-fs';
import { is404Error } from '@gitlab/gitlab-api-client';

/**
 * Decorator for FileContentProvider that returns 404 responses as empty
 */
export class FileContentProviderWith404AsEmpty implements FileContentProvider {
  readonly #base: FileContentProvider;

  constructor(base: FileContentProvider) {
    this.#base = base;
  }

  async getContent(path: string): Promise<Uint8Array> {
    try {
      // note: ESLint doesn't like it if I just return here...
      const value = await this.#base.getContent(path);

      return value;
    } catch (e: unknown) {
      if (is404Error(e)) {
        return new Uint8Array(0);
      }

      throw e;
    }
  }
}
