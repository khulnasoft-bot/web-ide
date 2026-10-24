import type { DefaultCrossWindowChannel } from '@khulnasoft/cross-origin-channel';
import { createFakePartial } from './createFakePartial';

export const createFakeCrossWindowChannel = () =>
  createFakePartial<DefaultCrossWindowChannel>({
    postMessage: jest.fn(),
    addMessageListener: jest.fn(),
    addMessagesListener: jest.fn().mockReturnValueOnce({ dispose: jest.fn() }),
    waitForMessage: jest.fn(),
    createLocalPortChannel: jest.fn(),
    requestRemotePortChannel: jest.fn(),
    dispose: jest.fn(),
  });
