import type { CrossWindowChannel } from '@gitlab/cross-origin-channel';
import {
  createMediatorMessageController,
  MEDIATOR_MESSAGE_KEYS,
} from './MediatorMessageController';
import type { MediatorMessageKey, MediatorMessageEvent } from './MediatorMessageController';

const isMessageEventData = <T extends MediatorMessageKey>(
  data: unknown,
): data is MediatorMessageEvent<T> => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const { key } = data as { key: string };

  return key in MEDIATOR_MESSAGE_KEYS;
};

export const handleMediatorMessages = (
  messagePort: MessagePort,
  windowChannel: CrossWindowChannel,
) => {
  const controller = createMediatorMessageController(windowChannel);

  messagePort.start();
  messagePort.addEventListener('message', event => {
    if (!isMessageEventData(event.data)) {
      return;
    }

    const { key, params } = event.data;

    // why: This cast isn't great, but I couldn't find a better way to dynamically select and spread the parameters :|
    (controller[key] as (...x: typeof params) => void)(...params);
  });
};
