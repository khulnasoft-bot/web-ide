import type { PortChannel } from '@gitlab/cross-origin-channel';
import { setupAutoRefresh } from '@gitlab/oauth-client';
import type { OAuthClient } from '@gitlab/oauth-client';
import { createFakePartial } from '@khulnasoft/utils-test';
import type { Disposable } from '@khulnasoft/web-ide-types';
import { AuthPortChannelController } from './AuthPortChannelController';

jest.mock('@gitlab/oauth-client');

describe('AuthPortChannelController', () => {
  let oauthClient: OAuthClient;
  let authPort: PortChannel;
  let authPortController: AuthPortChannelController;

  beforeEach(() => {
    oauthClient = createFakePartial<OAuthClient>({
      onTokenChange: jest.fn(),
      getToken: jest.fn(),
    });

    authPort = createFakePartial<PortChannel>({
      addMessageListener: jest.fn(),
      postMessage: jest.fn(),
      start: jest.fn(),
    });

    authPortController = new AuthPortChannelController({
      oauthClient,
      authPort,
    });
  });

  it('calls setupAutoRefresh', () => {
    expect(setupAutoRefresh).toHaveBeenCalledWith(oauthClient);
  });

  it('starts the authPort channel', () => {
    expect(authPort.start).toHaveBeenCalled();
  });

  it('listens to authentication-token-request messages', () => {
    expect(authPort.addMessageListener).toHaveBeenCalledWith(
      'authentication-token-request',
      expect.any(Function),
    );
  });

  describe('when oauthClient emits onTokenChange event', () => {
    beforeEach(() => {
      jest.mocked(oauthClient.onTokenChange).mock.calls[0][0]();
    });

    it('posts authentication-token-changed in the auth port channel', () => {
      expect(authPort.postMessage).toHaveBeenCalledWith({
        key: 'authentication-token-changed',
      });
    });
  });

  describe('when receiving authentication-token-request message', () => {
    const accessToken = 'mock-access-token';

    beforeEach(() => {
      jest.mocked(oauthClient.getToken).mockResolvedValueOnce({
        accessToken,
        expiresAt: 0,
      });

      jest.mocked(authPort.addMessageListener).mock.calls[0][1]({
        key: 'authentication-token-request',
      });
    });

    it('posts "authentication-token-response" message with the access token as params', async () => {
      expect(authPort.postMessage).toHaveBeenCalledWith({
        key: 'authentication-token-response',
        params: { token: accessToken },
      });
    });
  });

  describe('dispose', () => {
    let disposeOnTokenChange: jest.Mock;
    let disposeAutoRefresh: jest.Mock;
    let tokenRequestDisposable: Disposable;

    beforeEach(() => {
      disposeOnTokenChange = jest.fn();
      disposeAutoRefresh = jest.fn();
      tokenRequestDisposable = {
        dispose: jest.fn(),
      };
      jest.mocked(setupAutoRefresh).mockReturnValueOnce(disposeOnTokenChange);
      jest.mocked(oauthClient.onTokenChange).mockReturnValueOnce(disposeAutoRefresh);
      jest.mocked(authPort.addMessageListener).mockReturnValueOnce(tokenRequestDisposable);

      authPortController = new AuthPortChannelController({
        oauthClient,
        authPort,
      });
      authPortController.dispose();
    });

    it('disposes onTokenChange listener', () => {
      expect(disposeOnTokenChange).toHaveBeenCalled();
    });

    it('disposes auto refresh', () => {
      expect(disposeAutoRefresh).toHaveBeenCalled();
    });

    it('disposes tokenRequest listener', () => {
      expect(tokenRequestDisposable.dispose).toHaveBeenCalled();
    });
  });
});
