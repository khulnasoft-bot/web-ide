import type { CrossWindowChannel } from '@gitlab/cross-origin-channel';
import { handleMediatorMessages } from '@khulnasoft/vscode-mediator-commands';
import { createFakeCrossWindowChannel, useFakeMessageChannel } from '@khulnasoft/utils-test';
import { MessagePortsController } from './MessagePortsController';

jest.mock('@khulnasoft/vscode-mediator-commands');

describe('utils/MessagePortsController', () => {
  useFakeMessageChannel();

  let subject: MessagePortsController;
  let mockCrossWindowChannel: CrossWindowChannel;

  describe('default', () => {
    beforeEach(() => {
      mockCrossWindowChannel = createFakeCrossWindowChannel();
      subject = new MessagePortsController({
        windowChannel: mockCrossWindowChannel,
      });
    });

    it('calls handleMediatorMessages', () => {
      expect(handleMediatorMessages).toHaveBeenCalledWith(
        expect.any(Object),
        mockCrossWindowChannel,
      );
    });

    it('messagePorts - has messagePort with extension id', () => {
      expect(Array.from(subject.messagePorts.keys())).toEqual(['gitlab.khulnasoft-web-ide']);
    });

    it('onTokenChange - triggers message port', () => {
      const port = subject.messagePorts.get('gitlab.khulnasoft-web-ide');

      if (!port) {
        throw new Error('Expected MessagePort to be found');
      }

      const spy = jest.fn();
      port.addEventListener('message', e => spy(e.data));

      subject.onTokenChange();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('webide_auth_change');
    });
  });
});
