import type { CrossWindowChannel } from '@gitlab/cross-origin-channel';
import type { AuthProvider } from '@gitlab/gitlab-api-client';
import { DefaultAuthProvider } from '@gitlab/gitlab-api-client';
import type { WebIdeConfig } from '@khulnasoft/web-ide-types';
import { PortChannelAuthProvider } from './PortChannelAuthProvider';

interface GetAuthProviderOptions {
  config: WebIdeConfig;
  windowChannel: CrossWindowChannel;
  onTokenChange?: () => void;
}

export const getAuthProvider = async ({
  config,
  windowChannel,
  onTokenChange,
}: GetAuthProviderOptions): Promise<AuthProvider> => {
  if (config.auth.type === 'token') {
    return new DefaultAuthProvider(config.auth.token);
  }

  const portChannel = await windowChannel.requestRemotePortChannel('auth-port');

  return new PortChannelAuthProvider({
    portChannel,
    onTokenChange,
  });
};
