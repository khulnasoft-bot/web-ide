import type { StorageValueCache } from './types';

/**
 * This wraps the given StorageValueCache and emits to the EventTarget whenever
 * we should consider the `value` changed:
 *
 * - `setValue` was called
 * - `getValue` with `force: true` was called
 */
export class StorageValueCacheEventEmitter<T> implements StorageValueCache<T> {
  readonly #base: StorageValueCache<T>;

  readonly #eventTarget: EventTarget;

  readonly #event: string;

  constructor(base: StorageValueCache<T>, eventTarget: EventTarget, event: string) {
    this.#base = base;
    this.#eventTarget = eventTarget;
    this.#event = event;
  }

  async getValue(force?: boolean): Promise<T | undefined> {
    const value = await this.#base.getValue(force);

    if (force) {
      this.#dispatchEvent();
    }

    return value;
  }

  async setValue(value: T): Promise<void> {
    await this.#base.setValue(value);

    this.#dispatchEvent();
  }

  #dispatchEvent() {
    this.#eventTarget.dispatchEvent(new Event(this.#event));
  }
}
