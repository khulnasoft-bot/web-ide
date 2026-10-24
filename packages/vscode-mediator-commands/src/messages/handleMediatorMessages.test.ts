import { createFakeCrossWindowChannel, createFakePartial } from '@khulnasoft/utils-test';
import type { CrossWindowChannel } from '@khulnasoft/cross-origin-channel';
import {
  MESSAGE_OPEN_URI,
  MESSAGE_PREVENT_UNLOAD,
  MESSAGE_READY,
  MESSAGE_SET_HREF,
  MESSAGE_TRACK_EVENT,
  MESSAGE_UPDATE_WEB_IDE_CONTEXT,
} from '../constants';
import { handleMediatorMessages } from './handleMediatorMessages';
import { createMediatorMessageController } from './MediatorMessageController';
import type { MediatorMessageController } from './MediatorMessageController';

jest.mock('./MediatorMessageController');

describe('messages/handleMediatorMessages', () => {
  let fakeMessageController: MediatorMessageController;
  let messagePort: MessagePort;
  let mockCrossWindowChannel: CrossWindowChannel;
  let methodSpy: jest.Mock<unknown, unknown[]>;

  const triggerMessageListener = (data: unknown) => {
    jest.mocked(messagePort.addEventListener).mock.calls.forEach(([eventName, listener]) => {
      if (eventName === 'message') {
        (listener as (evt: MessageEvent) => void)(new MessageEvent('message', { data }));
      }
    });
  };

  beforeEach(() => {
    messagePort = createFakePartial<MessagePort>({
      start: jest.fn(),
      addEventListener: jest.fn(),
    });
    methodSpy = jest.fn();

    mockCrossWindowChannel = createFakeCrossWindowChannel();

    fakeMessageController = {
      [MESSAGE_OPEN_URI]: jest.fn(),
      [MESSAGE_READY]: jest.fn(),
      [MESSAGE_SET_HREF]: jest.fn(),
      [MESSAGE_PREVENT_UNLOAD]: jest.fn(),
      [MESSAGE_TRACK_EVENT]: jest.fn(),
      [MESSAGE_UPDATE_WEB_IDE_CONTEXT]: jest.fn(),
    };
    jest.mocked(createMediatorMessageController).mockReturnValue(fakeMessageController);

    handleMediatorMessages(messagePort, mockCrossWindowChannel);
  });

  it('starts messagePort', () => {
    expect(messagePort.start).toHaveBeenCalledTimes(1);
  });

  it('creates MediatorMessageController', () => {
    expect(createMediatorMessageController).toHaveBeenCalledTimes(1);
    expect(createMediatorMessageController).toHaveBeenCalledWith(mockCrossWindowChannel);
  });

  it('when unknown message is emitted, does nothing', () => {
    triggerMessageListener({ key: 'does-not-exist' });

    expect(methodSpy).not.toHaveBeenCalled();
  });

  it.each`
    key                               | params
    ${MESSAGE_OPEN_URI}               | ${[{ key: 'signIn' }]}
    ${MESSAGE_READY}                  | ${[]}
    ${MESSAGE_SET_HREF}               | ${['test']}
    ${MESSAGE_UPDATE_WEB_IDE_CONTEXT} | ${[{ branchName: 'test' }]}
  `(
    'when $key message iss emitted, calls controller method',
    ({ key, params }: { key: keyof MediatorMessageController; params: unknown[] }) => {
      triggerMessageListener({ key, params });

      expect(fakeMessageController[key]).toHaveBeenCalledTimes(1);
      expect(fakeMessageController[key]).toHaveBeenCalledWith(...params);
    },
  );
});
