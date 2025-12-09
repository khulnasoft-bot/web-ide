import type { PortChannel } from '@gitlab/cross-origin-channel';
import { createFakePartial } from '@khulnasoft/utils-test';
import { PortChannelAuthProvider } from './PortChannelAuthProvider';

describe('PortChannelAuthProvider', () => {
  let portChannelAuthProvider: PortChannelAuthProvider;
  let fakePortChannel: PortChannel;
  let onTokenChange: jest.Mock;

  beforeEach(() => {
    fakePortChannel = createFakePartial<PortChannel>({
      addMessageListener: jest.fn(),
      waitForMessage: jest.fn(),
      postMessage: jest.fn(),
      start: jest.fn(),
    });
    onTokenChange = jest.fn();
    portChannelAuthProvider = new PortChannelAuthProvider({
      portChannel: fakePortChannel,
      onTokenChange,
    });
  });

  it('starts port channel', () => {
    expect(fakePortChannel.start).toHaveBeenCalledTimes(1);
  });

  describe('when port channel receives authentication-token-changed message', () => {
    beforeEach(() => {
      jest.mocked(fakePortChannel.addMessageListener).mock.calls[0][1]({
        key: 'authentication-token-changed',
      });
    });

    it('invokes onTokenChange callback', () => {
      expect(onTokenChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('getToken', () => {
    let tokenPromise: Promise<string>;

    beforeEach(() => {
      jest.mocked(fakePortChannel.waitForMessage).mockResolvedValueOnce({
        params: { token: 'foo' },
        key: 'authentication-token-response',
      });
      tokenPromise = portChannelAuthProvider.getToken();
    });

    it('posts authentication-token-request message', () => {
      expect(fakePortChannel.postMessage).toHaveBeenCalledWith({
        key: 'authentication-token-request',
      });
    });

    it('returns token included in the authentication-token-response', async () => {
      expect(await tokenPromise).toBe('foo');
    });
  });
});
