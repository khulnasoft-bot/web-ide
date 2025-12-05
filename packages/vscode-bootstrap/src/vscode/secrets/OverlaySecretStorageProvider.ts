import type { ISecretStorageProvider } from '../types';

export class OverlaySecretStorageProvider implements ISecretStorageProvider {
  readonly #readonlyProvider: ISecretStorageProvider;

  readonly #writable: ISecretStorageProvider;

  constructor(readonlyProvider: ISecretStorageProvider, writable: ISecretStorageProvider) {
    this.#readonlyProvider = readonlyProvider;
    this.#writable = writable;
  }

  get type() {
    return this.#writable.type;
  }

  async get(key: string): Promise<string | undefined> {
    const writableResult = await this.#writable.get(key);

    if (writableResult !== undefined) {
      return writableResult;
    }

    return this.#readonlyProvider.get(key);
  }

  set(key: string, value: string): Promise<void> {
    return this.#writable.set(key, value);
  }

  delete(key: string): Promise<void> {
    return this.#writable.delete(key);
  }
}
