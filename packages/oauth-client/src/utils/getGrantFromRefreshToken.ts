import type { OAuthTokenGrant } from '../types';

export const getGrantFromRefreshToken = (refreshToken: string): OAuthTokenGrant => ({
  grant_type: 'refresh_token',
  refresh_token: refreshToken,
});
