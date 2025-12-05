import { DefaultStorageValueCache } from './DefaultStorageValueCache';
import { StorageValueCacheBroadcaster } from './StorageValueCacheBroadcaster';
import { StorageValueCacheEventEmitter } from './StorageValueCacheEventEmitter';
import type { OAuthStateBroadcaster, OAuthStorage, StorageValueCache } from './types';

export class StorageValueCacheBuilder<T> {
  #result: StorageValueCache<T>;

  constructor(storage: OAuthStorage, key: string) {
    this.#result = new DefaultStorageValueCache(storage, key);
  }

  withBroadcasting(broadcaster: OAuthStateBroadcaster) {
    this.#result = new StorageValueCacheBroadcaster(this.#result, broadcaster);

    return this;
  }

  withEventEmitter(emitter: EventTarget, event: string) {
    this.#result = new StorageValueCacheEventEmitter(this.#result, emitter, event);

    return this;
  }

  build(): StorageValueCache<T> {
    return this.#result;
  }
}
