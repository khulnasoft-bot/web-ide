export interface OAuthApp {
  // the unique client ID of the oauth app
  readonly clientId: string;

  // the callback URL associated with the client ID
  readonly callbackUrl: string;

  // the URL of the service used to authorize for an oauth token
  readonly authorizeUrl: string;

  // the URL of the service used to receive a token
  readonly tokenUrl: string;
}

export interface OAuthStorage {
  get<T>(key: string): Promise<T | null>;

  set(key: string, value: unknown): Promise<void>;

  remove(key: string): Promise<void>;
}

export interface OAuthStateBroadcaster {
  notifyTokenChange(): void;

  onTokenChange(callback: () => void): () => void;

  dispose(): void;
}

export interface OAuthHandshakeState {
  readonly state: string;

  readonly codeVerifier: string;

  readonly originalUrl: string;
}

export interface OAuthTokenState {
  readonly accessToken: string;

  readonly expiresAt: number;

  readonly refreshToken?: string;

  readonly owner?: string;
}

export interface TokenProvider {
  getToken(): Promise<OAuthTokenState>;
}

export type OAuthTokenGrant =
  | {
      readonly grant_type: 'refresh_token';

      readonly refresh_token: string;
    }
  | {
      readonly grant_type: 'authorization_code';

      readonly code: string;

      readonly code_verifier: string;
    };

export type OAuthTokenGrantStrategy = (token: OAuthTokenState) => Promise<OAuthTokenGrant>;

export interface StorageValueCache<T> {
  /**
   * Return the cached value and optionally force the cache to refresh
   */
  getValue(force?: boolean): Promise<T | undefined>;

  setValue(value: T): Promise<void>;
}
