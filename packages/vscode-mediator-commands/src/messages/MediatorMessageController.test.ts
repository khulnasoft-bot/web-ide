import type {
  CrossWindowChannel,
  UpdateWebIDEContextMessage,
  WebIDETrackingMessage,
} from '@khulnasoft/cross-origin-channel';
import { createFakeCrossWindowChannel } from '@khulnasoft/utils-test';
import { createMediatorMessageController } from './MediatorMessageController';
import type { MediatorMessageController } from './MediatorMessageController';
import {
  MESSAGE_OPEN_URI,
  MESSAGE_PREVENT_UNLOAD,
  MESSAGE_READY,
  MESSAGE_SET_HREF,
  MESSAGE_TRACK_EVENT,
  MESSAGE_UPDATE_WEB_IDE_CONTEXT,
} from '../constants';

const TEST_TRACKING_EVENT_PARMS: WebIDETrackingMessage['params'] = {
  event: {
    name: 'remote-connection-failure',
  },
};

const TEST_UPDATE_WEB_IDE_CONTEXT_PARAMS: UpdateWebIDEContextMessage['params'] = {
  ref: 'test',
  projectPath: 'test-path',
};

describe('messages/MediatorMessageController', () => {
  let subject: MediatorMessageController;
  let mockCrossWindowChannel: CrossWindowChannel;

  beforeEach(() => {
    mockCrossWindowChannel = createFakeCrossWindowChannel();
    subject = createMediatorMessageController(mockCrossWindowChannel);
  });

  interface PostMessageTestCase {
    message: keyof MediatorMessageController;
    params: unknown[];
    expected: unknown;
  }

  describe.each`
    message                           | params                                  | expected
    ${MESSAGE_READY}                  | ${[]}                                   | ${{ key: 'ready' }}
    ${MESSAGE_PREVENT_UNLOAD}         | ${[{ shouldPrevent: true }]}            | ${{ key: 'prevent-unload', params: { shouldPrevent: true } }}
    ${MESSAGE_TRACK_EVENT}            | ${[TEST_TRACKING_EVENT_PARMS]}          | ${{ key: 'web-ide-tracking', params: TEST_TRACKING_EVENT_PARMS }}
    ${MESSAGE_UPDATE_WEB_IDE_CONTEXT} | ${[TEST_UPDATE_WEB_IDE_CONTEXT_PARAMS]} | ${{ key: 'update-web-ide-context', params: TEST_UPDATE_WEB_IDE_CONTEXT_PARAMS }}
    ${MESSAGE_OPEN_URI}               | ${[{ key: 'feedbackIssue' }]}           | ${{ key: 'open-uri', params: { uriKey: 'feedbackIssue' } }}
    ${MESSAGE_SET_HREF}               | ${['/new/path/place']}                  | ${{ key: 'set-href', params: { href: '/new/path/place' } }}
  `('$message', ({ message, params, expected }: PostMessageTestCase) => {
    beforeEach(() => {
      // note: This cast isn't great, but I can't find a better way to dynamically apply these params
      (subject[message] as (...x: typeof params) => void)(...params);
    });

    it('triggers postMessage', () => {
      expect(mockCrossWindowChannel.postMessage).toHaveBeenCalledTimes(1);
      expect(mockCrossWindowChannel.postMessage).toHaveBeenCalledWith(expected);
    });
  });
});
