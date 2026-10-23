import type { ExtensionContext, SecretStorage } from 'vscode';
import { createFakePartial } from '@gitlab/utils-test';
import { WebIdeExtensionTokenProvider } from './WebIdeExtensionTokenProvider';

const TEST_AUTH_TOKEN = 'test-auth-token';

describe('authentication/WebIdeExtensionTokenProvider', () => {
  let extensionContext: ExtensionContext;
  let subject: WebIdeExtensionTokenProvider;

  beforeEach(() => {
    extensionContext = createFakePartial<ExtensionContext>({
      secrets: createFakePartial<SecretStorage>({
        get: jest.fn().mockResolvedValue(TEST_AUTH_TOKEN),
      }),
    });
    subject = new WebIdeExtensionTokenProvider(extensionContext);
  });

  it('returns the auth token from secret storage', async () => {
    const actual = await subject.getToken();

    expect(actual).toBe(TEST_AUTH_TOKEN);
    expect(extensionContext.secrets.get).toHaveBeenCalledTimes(1);
    expect(extensionContext.secrets.get).toHaveBeenCalledWith('auth_token');
  });

  it('when not found, returns empty string', async () => {
    jest.mocked(extensionContext.secrets.get).mockResolvedValueOnce(undefined);

    const actual = await subject.getToken();

    expect(actual).toBe('');
  });
});
