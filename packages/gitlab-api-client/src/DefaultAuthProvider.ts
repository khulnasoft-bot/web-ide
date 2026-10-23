import type { AuthProvider } from './types';

export class DefaultAuthProvider implements AuthProvider {
  readonly #token: string;

  constructor(token: string) {
    this.#token = token;
  }

  getToken(): Promise<string> {
    return Promise.resolve(this.#token);
  }
}

export const NOOP_AUTH_PROVIDER = new DefaultAuthProvider('');
