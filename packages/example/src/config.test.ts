import { createMockLocation } from '@gitlab/utils-test';
import { getEmbedderOriginUrl, getExtensionsHostBaseUrl, getWorkbenchBaseUrl } from './config';
import { viteEnv } from './viteEnv';

jest.mock('./viteEnv', () => ({ viteEnv: {} }));

describe('./config', () => {
  beforeEach(() => {
    const mockLocation = createMockLocation({
      origin: 'https://example.com:8000',
    });

    Object.defineProperty(window, 'location', {
      get() {
        return mockLocation;
      },
    });
  });

  describe.each`
    property                           | fn
    ${'VITE_EMBEDDER_ORIGIN_URL'}      | ${getEmbedderOriginUrl}
    ${'VITE_WORKBENCH_BASE_URL'}       | ${getWorkbenchBaseUrl}
    ${'VITE_EXTENSIONS_HOST_BASE_URL'} | ${getExtensionsHostBaseUrl}
  `('$property', ({ property, fn }) => {
    it.each`
      input                                    | output
      ${'http://location:8000/path/to/foo/'}   | ${'http://location:8000/path/to/foo/'}
      ${'/path/to/foo/'}                       | ${'http://localhost/path/to/foo/'}
      ${'{{quality}}/{{commit}}/path/to/foo/'} | ${'http://localhost/{{quality}}/{{commit}}/path/to/foo/'}
    `('with "$input", expects $output', ({ input, output }) => {
      viteEnv[property] = input;

      expect(fn()).toBe(output);
    });
  });
});
