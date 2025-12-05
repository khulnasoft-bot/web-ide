import {
  createConfig,
  createFakeCrossWindowChannel,
  createFakePartial,
  useFakeBroadcastChannel,
} from '@gitlab/utils-test';
import type { AuthConfig, OAuthConfig } from '@gitlab/web-ide-types';
import type { CrossWindowChannel, PortChannel } from '@gitlab/cross-origin-channel';
import { getAuthProvider } from './getAuthProvider';
import { PortChannelAuthProvider } from './PortChannelAuthProvider';

const TEST_TOKEN_AUTH: AuthConfig = {
  type: 'token',
  token: 'lorem-ipsum-dolar',
};

const TEST_OAUTH_AUTH: OAuthConfig = {
  type: 'oauth',
  callbackUrl: 'https://example.com/callback_url',
  clientId: '123456',
};

jest.mock('./PortChannelAuthProvider');

describe('utils/getAuthProvider', () => {
  let fakePortChannel: PortChannel;
  let windowChannel: CrossWindowChannel;
  let onTokenChange: () => void;

  useFakeBroadcastChannel();

  const configWithAuth = (auth: AuthConfig) => ({
    ...createConfig(),
    auth,
  });

  beforeEach(() => {
    fakePortChannel = createFakePartial<PortChannel>({});
    windowChannel = createFakeCrossWindowChannel();
    onTokenChange = jest.fn();

    jest.mocked(windowChannel.requestRemotePortChannel).mockResolvedValue(fakePortChannel);
  });

  it('returns token provider with token auth', async () => {
    const provider = await getAuthProvider({
      config: configWithAuth(TEST_TOKEN_AUTH),
      windowChannel,
    });

    const actual = await provider?.getToken();

    expect(provider).not.toBeUndefined();
    expect(actual).toEqual(TEST_TOKEN_AUTH.token);
  });

  it('returns port channel auth provider with oauth', async () => {
    const provider = await getAuthProvider({
      config: configWithAuth(TEST_OAUTH_AUTH),
      windowChannel,
      onTokenChange,
    });

    expect(windowChannel.requestRemotePortChannel).toHaveBeenCalledWith('auth-port');
    expect(PortChannelAuthProvider).toHaveBeenCalledTimes(1);
    expect(PortChannelAuthProvider).toHaveBeenCalledWith({
      portChannel: fakePortChannel,
      onTokenChange,
    });
    expect(provider).not.toBeUndefined();
    expect(provider).toBeInstanceOf(PortChannelAuthProvider);
  });
});
