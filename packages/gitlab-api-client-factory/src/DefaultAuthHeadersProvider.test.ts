import { DefaultAuthProvider } from '@gitlab/gitlab-api-client';

import {
  createOAuthHeadersProvider,
  createPrivateTokenHeadersProvider,
} from './DefaultAuthHeadersProvider';

const TEST_AUTH_PROVIDER = new DefaultAuthProvider('test-token');

describe('DefaultAuthHeadersProvider', () => {
  describe.each`
    desc                                   | factory                                                        | expectation
    ${'createOAuthHeadersProvider'}        | ${() => createOAuthHeadersProvider(TEST_AUTH_PROVIDER)}        | ${{ Authorization: 'Bearer test-token' }}
    ${'createPrivateTokenHeadersProvider'} | ${() => createPrivateTokenHeadersProvider(TEST_AUTH_PROVIDER)} | ${{ 'PRIVATE-TOKEN': 'test-token' }}
  `('$desc', ({ factory, expectation }) => {
    it('creates a headers provider that returns expected headers', async () => {
      const authHeadersProvider = factory();

      const actual = await authHeadersProvider.getHeaders();

      expect(actual).toEqual(expectation);
    });
  });
});
