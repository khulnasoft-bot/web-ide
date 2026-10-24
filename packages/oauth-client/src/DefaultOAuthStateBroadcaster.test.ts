import { useFakeBroadcastChannel } from '@khulnasoft/utils-test';
import {
  DefaultOAuthStateBroadcaster,
  CHANNEL_NAME,
  TOKEN_CHANGE_MESSAGE,
} from './DefaultOAuthStateBroadcaster';

describe('DefaultOAuthStateBroadcaster', () => {
  let subject: DefaultOAuthStateBroadcaster;
  let bc: jest.MockedObject<BroadcastChannel>;

  useFakeBroadcastChannel();

  const triggerMessageListener = (data: string) => {
    const evt = new MessageEvent('message', { data });
    const handler = bc.addEventListener.mock.calls[0][1];

    if ('handleEvent' in handler) {
      handler.handleEvent(evt);
    } else {
      handler(evt);
    }
  };

  describe('default', () => {
    beforeEach(() => {
      subject = new DefaultOAuthStateBroadcaster();
      bc = jest.mocked(jest.mocked(BroadcastChannel).mock.instances[0]);
    });

    it('creates new BroadcastChannel', () => {
      expect(BroadcastChannel).toHaveBeenCalledTimes(1);
      expect(BroadcastChannel).toHaveBeenCalledWith(CHANNEL_NAME);
    });

    describe('notifyTokenChange', () => {
      it('posts message to channel', () => {
        expect(bc.postMessage).not.toHaveBeenCalled();

        subject.notifyTokenChange();

        expect(bc.postMessage).toHaveBeenCalledTimes(1);
        expect(bc.postMessage).toHaveBeenCalledWith(TOKEN_CHANGE_MESSAGE);
      });
    });

    describe('dispose', () => {
      it('calls close', () => {
        expect(bc.close).not.toHaveBeenCalled();

        subject.dispose();

        expect(bc.close).toHaveBeenCalled();
      });
    });

    describe('onTokenChange', () => {
      it('registers handler that is called only when expected message is received', () => {
        expect(bc.addEventListener).not.toHaveBeenCalled();

        const spy = jest.fn();
        subject.onTokenChange(spy);

        expect(bc.addEventListener).toHaveBeenCalledTimes(1);
        expect(bc.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));

        triggerMessageListener('bogus');
        expect(spy).not.toHaveBeenCalled();

        triggerMessageListener(TOKEN_CHANGE_MESSAGE);
        triggerMessageListener(TOKEN_CHANGE_MESSAGE);
        triggerMessageListener('bogus');
        expect(spy).toHaveBeenCalledTimes(2);
      });

      it('returns returns function that will removeEventListener', () => {
        const spy = jest.fn();
        const stop = subject.onTokenChange(spy);
        const handler = bc.addEventListener.mock.calls[0][1];

        expect(bc.removeEventListener).not.toHaveBeenCalled();

        stop();

        expect(bc.removeEventListener).toHaveBeenCalledTimes(1);
        expect(bc.removeEventListener).toHaveBeenCalledWith('message', handler);
      });
    });
  });
});
