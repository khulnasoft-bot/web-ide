import { createMockLocation } from '@khulnasoft/utils-test';
import { handleSetHrefMessage } from './handleSetHrefMessage';

describe('handleSetHrefMessage', () => {
  beforeEach(() => {
    const mockLocation = createMockLocation();
    Object.defineProperty(window, 'location', {
      get() {
        return mockLocation;
      },
    });
  });

  it.each`
    origHref                    | href                                   | expectHref
    ${'http://localhost/'}      | ${'/new/path/place'}                   | ${'http://localhost/new/path/place'}
    ${'http://localhost/-/ide'} | ${'/new/path/place'}                   | ${'http://localhost/new/path/place'}
    ${'http://localhost/-/ide'} | ${'http://example.org/new/path/place'} | ${'http://example.org/new/path/place'}
  `(
    'with origHref=$origHref and href=$href, updates window.parent.location',
    async ({ origHref, href, expectHref }) => {
      window.location.href = origHref;

      await handleSetHrefMessage({
        key: 'set-href',
        params: {
          href,
        },
      });

      expect(window.location.href).toBe(expectHref);
    },
  );
});
