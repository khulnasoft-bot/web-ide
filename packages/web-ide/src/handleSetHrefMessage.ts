import type { SetHrefMessage } from '@khulnasoft/cross-origin-channel';

export const handleSetHrefMessage = (message: SetHrefMessage) => {
  const parentHref = window.location.href;
  const newUrl = new URL(message.params.href, parentHref);

  window.parent.location.href = newUrl.href;
};
