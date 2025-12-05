import type { OAuthTokenState } from '../types';

export const BUFFER_MIN = 5;
export const BUFFER_MS = 1000 * 60 * BUFFER_MIN; // 5 minutes

export const isExpiredToken = (state: OAuthTokenState) => state.expiresAt - BUFFER_MS < Date.now();

const hasNonEmptyValues = (state: OAuthTokenState) => Boolean(state.accessToken && state.expiresAt);

const isOwnedBy = (state: OAuthTokenState, owner: string) => owner === (state.owner || '');

export const isValidToken = (state: OAuthTokenState, owner: string) =>
  hasNonEmptyValues(state) && !isExpiredToken(state) && isOwnedBy(state, owner);
