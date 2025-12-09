import type { AuthHeadersProvider, AuthProvider } from '@gitlab/gitlab-api-client';
import { DefaultGitLabClient } from '@gitlab/gitlab-api-client';
import { createFakePartial, createWebIdeExtensionConfig } from '@khulnasoft/utils-test';
import { createGitLabClient } from './createGitLabClient';
import { getAuthHeadersProvider } from './getAuthHeadersProvider';

jest.mock('@gitlab/gitlab-api-client');
jest.mock('./getAuthHeadersProvider');

const TEST_CONFIG = {
  ...createWebIdeExtensionConfig(),
  httpHeaders: {
    'X-Test-Header': 'test-header-value',
  },
};
const TEST_AUTH_PROVIDER = createFakePartial<AuthProvider>({});
const TEST_AUTH_HEADERS_PROVIDER = createFakePartial<AuthHeadersProvider>({});

describe('createGitLabClient', () => {
  let subject: DefaultGitLabClient;

  beforeEach(() => {
    jest.mocked(getAuthHeadersProvider).mockReturnValue(TEST_AUTH_HEADERS_PROVIDER);
  });

  it('creates a DefaultGitLabClient', () => {
    expect(DefaultGitLabClient).not.toHaveBeenCalled();

    subject = createGitLabClient(TEST_CONFIG, TEST_AUTH_PROVIDER);

    expect(subject).toBeInstanceOf(DefaultGitLabClient);
    expect(DefaultGitLabClient).toHaveBeenCalledTimes(1);
    expect(DefaultGitLabClient).toHaveBeenCalledWith({
      auth: TEST_AUTH_HEADERS_PROVIDER,
      baseUrl: TEST_CONFIG.gitlabUrl,
      httpHeaders: TEST_CONFIG.httpHeaders,
    });
  });

  it('calls getAuthHeadersProvider headers', () => {
    expect(getAuthHeadersProvider).toHaveBeenCalledTimes(0);

    subject = createGitLabClient(TEST_CONFIG, TEST_AUTH_PROVIDER);

    expect(getAuthHeadersProvider).toHaveBeenCalledTimes(1);
    expect(getAuthHeadersProvider).toHaveBeenCalledWith(TEST_CONFIG.auth?.type, TEST_AUTH_PROVIDER);
  });
});
