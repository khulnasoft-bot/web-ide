import { Mutex } from './Mutex';
import type { OAuthStorage, StorageValueCache } from './types';

export class DefaultStorageValueCache<T> implements StorageValueCache<T> {
  readonly #storage: OAuthStorage;

  readonly #key: string;

  readonly #mutex: Mutex;

  #cachedValue: T | undefined;

  constructor(storage: OAuthStorage, key: string) {
    this.#storage = storage;
    this.#key = key;
    this.#mutex = new Mutex();
    this.#cachedValue = undefined;
  }

  async getValue(force = false): Promise<T | undefined> {
    const unlock = await this.#mutex.lock();

    try {
      if (this.#cachedValue !== undefined && !force) {
        return this.#cachedValue;
      }

      return await this.#refreshCache();
    } finally {
      unlock();
    }
  }

  async setValue(value: T): Promise<void> {
    const unlock = await this.#mutex.lock();

    try {
      await this.#storage.set(this.#key, value);

      this.#cachedValue = value;
    } finally {
      unlock();
    }
  }

  async #refreshCache(): Promise<T | undefined> {
    const value = await this.#storage.get<T>(this.#key);

    this.#cachedValue = value === null ? undefined : value;

    return this.#cachedValue;
  }
}
