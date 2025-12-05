import type { ISecretStorageProvider } from '../types';

export class InMemorySecretStorageProvider implements ISecretStorageProvider {
  readonly #map: Map<string, string>;

  constructor() {
    this.#map = new Map();
  }

  readonly type = 'in-memory';

  async get(key: string): Promise<string | undefined> {
    if (this.#map.has(key)) {
      return this.#map.get(key);
    }

    return undefined;
  }

  async set(key: string, value: string): Promise<void> {
    this.#map.set(key, value);
  }

  async delete(key: string) {
    this.#map.delete(key);
  }
}
