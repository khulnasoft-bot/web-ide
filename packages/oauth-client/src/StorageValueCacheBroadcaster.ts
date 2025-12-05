import type { OAuthStateBroadcaster, StorageValueCache } from './types';

export class StorageValueCacheBroadcaster<T> implements StorageValueCache<T> {
  static decorator<T>(
    broadcaster: OAuthStateBroadcaster,
  ): (base: StorageValueCache<T>) => StorageValueCache<T> {
    return base => new StorageValueCacheBroadcaster(base, broadcaster);
  }

  readonly #base: StorageValueCache<T>;

  readonly #broadcaster: OAuthStateBroadcaster;

  constructor(cache: StorageValueCache<T>, broadcaster: OAuthStateBroadcaster) {
    this.#base = cache;
    this.#broadcaster = broadcaster;

    this.#broadcaster.onTokenChange(() => {
      // Force refresh with "true"
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.#base.getValue(true);
    });
  }

  async getValue(force = false): Promise<T | undefined> {
    return this.#base.getValue(force);
  }

  async setValue(value: T): Promise<void> {
    await this.#base.setValue(value);

    this.#broadcaster.notifyTokenChange();
  }
}
