import type { OpenURIMessage } from '@gitlab/cross-origin-channel';
import type { WebIdeConfig } from '@gitlab/web-ide-types';

export const handleOpenUriMessage = (config: WebIdeConfig, message: OpenURIMessage) => {
  const webIdeLink = config.links[message.params.uriKey];

  // We still check for existence because we could be used in a non-typescript environment.
  // TODO: What if the URL wasn't given...
  if (webIdeLink) {
    window.open(webIdeLink, '_blank', 'noopener,noreferrer');
  }
};
