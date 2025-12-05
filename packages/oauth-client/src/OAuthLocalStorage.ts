import type { Logger } from '@gitlab/logger';
import type { OAuthStorage } from './types';
import { encodeBase64, decodeBase64 } from './utils';

interface OAuthLocalStorageOptions {
  readonly excludeKeys?: string[];
  readonly logger?: Logger;
}

export class OAuthLocalStorage implements OAuthStorage {
  readonly #excludeKeys: ReadonlySet<string>;

  readonly #logger?: Logger;

  constructor({ excludeKeys, logger }: OAuthLocalStorageOptions = {}) {
    this.#excludeKeys = new Set(excludeKeys || []);

    this.#logger = logger;
  }

  async get<T>(key: string): Promise<T | null> {
    const valueAsStr = window.localStorage.getItem(key);

    if (valueAsStr === null) {
      return null;
    }

    try {
      return JSON.parse(decodeBase64(valueAsStr)) as T;
    } catch (e) {
      this.#logger?.error('Failed to parse value for given key as JSON from localStorage', e);

      // note: For now we can assume that a malformed token is the same as no token
      return null;
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    const cleanValue = this.#cleanValue(value);
    const valueAsStr = encodeBase64(JSON.stringify(cleanValue));

    window.localStorage.setItem(key, valueAsStr);
  }

  // eslint-disable-next-line class-methods-use-this
  async remove(key: string): Promise<void> {
    window.localStorage.removeItem(key);
  }

  #cleanValue(value: unknown): unknown {
    if (this.#excludeKeys.size === 0) {
      return value;
    }
    if (!value || typeof value !== 'object') {
      return value;
    }

    const entries = Object.entries(value).filter(([key]) => !this.#excludeKeys.has(key));

    return Object.fromEntries(entries);
  }
}
