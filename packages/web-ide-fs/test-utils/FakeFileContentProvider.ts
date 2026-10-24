import { joinPaths } from '@khulnasoft/utils-path';
import { FileContentProvider } from '../src';

export class FileNotFoundErorr extends Error {}

export class FakeFileContentProvider implements FileContentProvider {
  private readonly _files: Map<string, string>;

  constructor(fileContent: Record<string, string>) {
    this._files = new Map<string, string>();

    for (const [key, value] of Object.entries(fileContent)) {
      // Add leading "/" so we support both with and without leading "/"
      this._files.set(joinPaths('/', key), value);
    }
  }

  getContent(pathArg: string): Promise<Uint8Array> {
    // Add leading "/" so we support both with and without leading "/"
    const path = joinPaths('/', pathArg);

    if (!this._files.has(path)) {
      return Promise.reject(new FileNotFoundErorr(`File not found: ${path}`));
    }

    const content = this._files.get(path) || '';
    const arr = new TextEncoder().encode(content);

    return Promise.resolve(arr);
  }
}
