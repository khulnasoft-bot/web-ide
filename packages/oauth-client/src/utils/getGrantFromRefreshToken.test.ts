import { getGrantFromRefreshToken } from './getGrantFromRefreshToken';

const TEST_REFRESH_TOKEN = 'test-refresh-token';

describe('utils/getGrantFromRefreshToken', () => {
  it('returns refresh_token grant', () => {
    expect(getGrantFromRefreshToken(TEST_REFRESH_TOKEN)).toEqual({
      grant_type: 'refresh_token',
      refresh_token: TEST_REFRESH_TOKEN,
    });
  });
});
