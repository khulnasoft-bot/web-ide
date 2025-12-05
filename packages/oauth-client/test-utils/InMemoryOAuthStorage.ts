import { OAuthStorage } from '../src/types';

export class InMemoryOAuthStorage implements OAuthStorage {
  readonly #map: Map<string, unknown>;

  constructor() {
    this.#map = new Map();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = this.#map.get(key);

    if (value === undefined) {
      return null;
    }

    // note: Allow casting in test util
    return value as T;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.#map.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.#map.delete(key);
  }

  keys(): string[] {
    return Array.from(this.#map.keys());
  }
}
