import type { AuthHeadersProvider, AuthProvider } from '@khulnasoft/khulnasoft-api-client';

const oauthTokenAsHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

const accessTokenAsHeaders = (token: string) => ({
  'PRIVATE-TOKEN': token,
});

class DefaultAuthHeadersProvider implements AuthHeadersProvider {
  readonly #asHeaders: (token: string) => Record<string, string>;

  readonly #authProvider: AuthProvider;

  constructor(authProvider: AuthProvider, asHeaders: (token: string) => Record<string, string>) {
    this.#asHeaders = asHeaders;
    this.#authProvider = authProvider;
  }

  async getHeaders(): Promise<Record<string, string>> {
    const token = await this.#authProvider.getToken();

    return this.#asHeaders(token);
  }
}

export const createOAuthHeadersProvider = (authProvider: AuthProvider) =>
  new DefaultAuthHeadersProvider(authProvider, oauthTokenAsHeaders);

export const createPrivateTokenHeadersProvider = (authProvider: AuthProvider) =>
  new DefaultAuthHeadersProvider(authProvider, accessTokenAsHeaders);
