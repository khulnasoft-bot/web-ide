import type { AuthProvider } from '@khulnasoft/khulnasoft-api-client';
import { getAuthHeadersProvider } from './getAuthHeadersProvider';

const TEST_AUTH_PROVIDER: AuthProvider = {
  getToken() {
    return Promise.resolve('test-token');
  },
};

describe('getAuthHeadersProvider', () => {
  it.each`
    desc                     | authType     | auth                  | expected
    ${'with no authType'}    | ${undefined} | ${TEST_AUTH_PROVIDER} | ${undefined}
    ${'with no auth'}        | ${'oauth'}   | ${undefined}          | ${undefined}
    ${'with oauth authType'} | ${'oauth'}   | ${TEST_AUTH_PROVIDER} | ${{ Authorization: 'Bearer test-token' }}
    ${'with token authType'} | ${'token'}   | ${TEST_AUTH_PROVIDER} | ${{ 'PRIVATE-TOKEN': 'test-token' }}
  `(
    '$desc, returns auth headers provider that gives $expected',
    async ({ authType, auth, expected }) => {
      const authHeadersProvider = getAuthHeadersProvider(authType, auth);

      const result = await authHeadersProvider?.getHeaders();

      expect(result).toEqual(expected);
    },
  );
});
