import { createFakePartial } from '@gitlab/utils-test';
import type { WebIdeConfig } from '@gitlab/web-ide-types';
import { handleOpenUriMessage } from './handleOpenUriMessage';

describe('handleOpenUriMessage', () => {
  const config: WebIdeConfig = createFakePartial<WebIdeConfig>({
    links: {
      feedbackIssue: 'http://www.example.com/feedbackIssue',
      userPreferences: 'http://www.example.com/userPreferences',
      signIn: 'http://www.example.com/userPreferences',
    },
  });

  beforeEach(() => {
    window.open = jest.fn();
  });

  it.each`
    uriKey               | uriValue
    ${'feedbackIssue'}   | ${config.links.feedbackIssue}
    ${'userPreferences'} | ${config.links.userPreferences}
  `('opens $uriValue in new window when uri key is $key', async ({ uriKey, uriValue }) => {
    handleOpenUriMessage(config, { key: 'open-uri', params: { uriKey } });

    expect(window.parent.open).toHaveBeenCalledWith(uriValue, '_blank', 'noopener,noreferrer');
  });
});
