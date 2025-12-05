import type { AuthProvider } from '@gitlab/gitlab-api-client';
import type { TokenProvider } from './types';

class ApiClientOAuthProvider implements AuthProvider {
  readonly #client: TokenProvider;

  constructor(client: TokenProvider) {
    this.#client = client;
  }

  async getToken(): Promise<string> {
    const tokenState = await this.#client.getToken();

    return tokenState.accessToken;
  }
}

export const asOAuthProvider = (client: TokenProvider) => new ApiClientOAuthProvider(client);
