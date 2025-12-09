import type {
  OAuthApp,
  OAuthStateBroadcaster,
  OAuthStorage,
  OAuthTokenState,
  OAuthHandshakeState,
  StorageValueCache,
  TokenProvider,
  OAuthTokenGrant,
} from './types';
import {
  authorizeGrantWithIframe,
  BUFFER_MIN,
  generateAuthorizeUrl,
  getGrantFromCallbackUrl,
  getGrantFromRefreshToken,
  isCallbackFromIframe,
  isExpiredToken,
  isValidToken,
  notifyParentFromIframe,
} from './utils';
import { StorageValueCacheBuilder } from './StorageValueCacheBuilder';

export const STORAGE_KEY_PREFIX = 'khulnasoft/web-ide/oauth';
const EVENT_TYPE = 'oauth_change';

interface OAuthClientOptions {
  // properties of the OAuth Application to use for authentication
  readonly app: OAuthApp;

  // implementation for storing the OAuth state
  readonly storage: OAuthStorage;

  // implementation for broadcasting changes to the OAuth state
  readonly broadcaster: OAuthStateBroadcaster;

  // the owner to associate with the token (used to validate if the current token should be used or not)
  readonly owner?: string;

  // used to overwrite the `expiresAt` received whenever the token is granted
  readonly tokenLifetime?: number;
}

export interface OAuthClient extends TokenProvider {
  /**
   * Returns boolean for whether there's a valid token stored for this OAuthClient.
   */
  checkForValidToken(): Promise<boolean>;

  /**
   * Redirects to the OAuthApp's authorize URL for OAuth handshake
   */
  redirectToAuthorize(): Promise<void>;

  /**
   * When the OAuthApp's authroize URL redirects back to the app, this method should be triggered.
   *
   * - If the OAuth handshake was done silently in an iframe, we'll notify the parent frame
   * - Else, let's fetch and store a token, then redirect back to the original URL
   */
  handleCallback(): Promise<void>;

  /**
   * @param callback listener that will be triggered when the token has changed
   */
  onTokenChange(callback: () => void): () => void;
}

export class DefaultOAuthClient implements OAuthClient {
  readonly #app: OAuthApp;

  readonly #storage: OAuthStorage;

  readonly #eventTarget: EventTarget;

  readonly #tokenCache: StorageValueCache<OAuthTokenState>;

  readonly #owner: string;

  readonly #tokenLifetime?: number;

  constructor(options: OAuthClientOptions) {
    this.#app = options.app;
    this.#storage = options.storage;
    this.#eventTarget = new EventTarget();

    this.#tokenCache = new StorageValueCacheBuilder<OAuthTokenState>(
      this.#storage,
      this.#tokenStorageKey(),
    )
      .withEventEmitter(this.#eventTarget, EVENT_TYPE)
      .withBroadcasting(options.broadcaster)
      .build();

    this.#owner = options.owner || '';
    this.#tokenLifetime = options.tokenLifetime;
  }

  // region: publics ---------------------------------------------------

  async getToken(): Promise<OAuthTokenState> {
    const token = await this.#tokenCache.getValue();

    if (!token) {
      // TODO: Handle this error better
      throw new Error('No token found! We need to do OAuth handshake again...');
    }

    if (!isValidToken(token, this.#owner)) {
      return this.#refreshToken(token);
    }

    return token;
  }

  async checkForValidToken(): Promise<boolean> {
    const state = await this.#tokenCache.getValue(true);

    if (!state) {
      return false;
    }

    return isValidToken(state, this.#owner);
  }

  async redirectToAuthorize() {
    const { url, handshakeState } = await generateAuthorizeUrl(this.#app);

    await this.#setHandshakeState(handshakeState);

    window.location.href = url;
  }

  async handleCallback() {
    if (isCallbackFromIframe()) {
      notifyParentFromIframe();
      return;
    }

    const url = new URL(window.location.href);

    const handshakeState = await this.#getHandshakeState();
    if (!handshakeState) {
      throw new Error('handshake state not found');
    }

    const grant = getGrantFromCallbackUrl(url, handshakeState);

    await this.#requestAndStoreToken(grant);
    await this.#deleteHandshakeState();

    window.location.href = handshakeState.originalUrl;
  }

  onTokenChange(callback: () => void): () => void {
    this.#eventTarget.addEventListener(EVENT_TYPE, callback);

    return () => {
      this.#eventTarget.removeEventListener(EVENT_TYPE, callback);
    };
  }

  // region: privates --------------------------------------------------

  async #refreshToken(token: OAuthTokenState) {
    const grant = await this.#getGrantFromToken(token);

    return this.#requestAndStoreToken(grant);
  }

  async #getGrantFromToken(token: OAuthTokenState): Promise<OAuthTokenGrant> {
    if (token.refreshToken) {
      return getGrantFromRefreshToken(token.refreshToken);
    }

    return authorizeGrantWithIframe(this.#app);
  }

  async #requestAndStoreToken(params: OAuthTokenGrant) {
    const response = await fetch(this.#app.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.#app.clientId,
        redirect_uri: this.#app.callbackUrl,
        ...params,
      }).toString(),
    });

    if (!response.ok) {
      // TODO: Handle this better
      const errorResponse = await response.json().catch(() => ({}));

      throw new Error(
        `Something bad happened while getting OAuth token: ${JSON.stringify(errorResponse)}`,
      );
    }

    const responseJson = await response.json();
    const expiresIn =
      this.#tokenLifetime === undefined ? responseJson.expires_in : this.#tokenLifetime;

    const value: OAuthTokenState = {
      accessToken: responseJson.access_token,
      // why: * 1000 to convert seconds to ms
      expiresAt: (responseJson.created_at + expiresIn) * 1000,
      refreshToken: responseJson.refresh_token,
      // why: If owner is falsey it's the same as undefined. Let's not save it in localStorage.
      owner: this.#owner || undefined,
    };

    if (isExpiredToken(value)) {
      throw new Error(`[OAuth] Access token lifetime cannot be less than ${BUFFER_MIN} minutes.`);
    }

    await this.#tokenCache.setValue(value);

    return value;
  }

  #getHandshakeState(): Promise<OAuthHandshakeState | null> {
    return this.#storage.get<OAuthHandshakeState>(this.#handshakeStorageKey());
  }

  #setHandshakeState(state: OAuthHandshakeState) {
    return this.#storage.set(this.#handshakeStorageKey(), state);
  }

  #deleteHandshakeState() {
    return this.#storage.remove(this.#handshakeStorageKey());
  }

  #tokenStorageKey(): string {
    return `${STORAGE_KEY_PREFIX}/${this.#app.clientId}/token`;
  }

  #handshakeStorageKey(): string {
    return `${STORAGE_KEY_PREFIX}/${this.#app.clientId}/handshake`;
  }
}
