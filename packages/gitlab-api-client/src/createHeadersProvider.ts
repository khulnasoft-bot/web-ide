import type { AuthHeadersProvider } from './types';

export const createHeadersProvider = (headers: Record<string, string>): AuthHeadersProvider => ({
  getHeaders: () => Promise.resolve(headers),
});

export const NOOP_AUTH_HEADERS_PROVIDER = createHeadersProvider({});
