import type { ISecretStorageProvider } from '../types';

type KeyPredicate = (key: string) => boolean;
type ValueProvider = () => Promise<string>;
export type SecretStorageEntry = [KeyPredicate, ValueProvider];

export class ReadonlySecretStorageProvider implements ISecretStorageProvider {
  readonly #values: SecretStorageEntry[];

  constructor(values: SecretStorageEntry[]) {
    this.#values = values;
  }

  readonly type = 'in-memory';

  async get(key: string): Promise<string | undefined> {
    const valueProvider = this.#values.find(([predicate]) => predicate(key))?.[1];

    if (!valueProvider) {
      return undefined;
    }

    return valueProvider();
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  set(key: string, value: string): Promise<void> {
    // note: Instead of panicing, let's just intentionally no-op
    return Promise.resolve();
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  delete(key: string): Promise<void> {
    // note: Instead of panicing, let's just intentionally no-op
    return Promise.resolve();
  }
}
