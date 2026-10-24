import { createMockLocation } from '@khulnasoft/utils-test';
import {
  getCrossOriginExtensionHost,
  getEmbedderOriginUrl,
  getExtensionsHostBaseUrl,
  getWorkbenchBaseUrl,
  validateCrossOriginExtensionHost,
} from './config';
import { viteEnv } from './viteEnv';

jest.mock('./viteEnv', () => ({ viteEnv: {} }));

const clearViteEnv = () => {
  const env = viteEnv as Record<string, unknown>;
  Object.keys(env).forEach(key => {
    Reflect.deleteProperty(env, key);
  });
};

describe('./config', () => {
  beforeEach(() => {
    clearViteEnv();

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
      (viteEnv as Record<string, unknown>)[property] = input;

      expect(fn()).toBe(output);
    });
  });

  describe('getCrossOriginExtensionHost', () => {
    it.each`
      input        | output
      ${undefined} | ${true}
      ${''}        | ${true}
      ${'true'}    | ${true}
      ${'false'}   | ${false}
    `('with "$input", expects $output', ({ input, output }) => {
      const env = viteEnv as Record<string, unknown>;
      if (input === undefined) {
        // @ts-expect-error testing cleanup
        delete env.VITE_CROSS_ORIGIN_EXTENSION_HOST;
      } else {
        env.VITE_CROSS_ORIGIN_EXTENSION_HOST = input;
      }

      expect(getCrossOriginExtensionHost()).toBe(output);
    });

    it('throws when the value is not a boolean', () => {
      (viteEnv as Record<string, unknown>).VITE_CROSS_ORIGIN_EXTENSION_HOST = 'yes';

      expect(() => getCrossOriginExtensionHost()).toThrow(
        "Expected environment variable 'VITE_CROSS_ORIGIN_EXTENSION_HOST' to be 'true' or 'false'.",
      );
    });
  });

  describe('validateCrossOriginExtensionHost', () => {
    const setHosts = ({
      crossOriginExtensionHost,
      workbenchBaseUrl,
      extensionsHostBaseUrl,
    }: {
      crossOriginExtensionHost: string;
      workbenchBaseUrl: string;
      extensionsHostBaseUrl: string;
    }) => {
      const env = viteEnv as Record<string, unknown>;
      env.VITE_CROSS_ORIGIN_EXTENSION_HOST = crossOriginExtensionHost;
      env.VITE_WORKBENCH_BASE_URL = workbenchBaseUrl;
      env.VITE_EXTENSIONS_HOST_BASE_URL = extensionsHostBaseUrl;
    };

    it('does nothing when cross-origin extension host is disabled', () => {
      setHosts({
        crossOriginExtensionHost: 'false',
        workbenchBaseUrl: 'web-ide/public',
        extensionsHostBaseUrl: 'web-ide/public/vscode',
      });

      expect(() => validateCrossOriginExtensionHost()).not.toThrow();
    });

    it('accepts distinct origins with the uuid template', () => {
      setHosts({
        crossOriginExtensionHost: 'true',
        workbenchBaseUrl: 'https://workbench.example.com/web-ide/public',
        extensionsHostBaseUrl: 'https://{{uuid}}.example.com/web-ide/public/vscode',
      });

      expect(() => validateCrossOriginExtensionHost()).not.toThrow();
    });

    it('throws when the extensions host is missing the uuid template', () => {
      setHosts({
        crossOriginExtensionHost: 'true',
        workbenchBaseUrl: 'https://workbench.example.com/web-ide/public',
        extensionsHostBaseUrl: 'https://extensions.example.com/web-ide/public/vscode',
      });

      expect(() => validateCrossOriginExtensionHost()).toThrow(
        /VITE_EXTENSIONS_HOST_BASE_URL must include the "\{\{uuid\}\}" template/,
      );
    });

    it('throws when the workbench and extensions hosts share an origin', () => {
      setHosts({
        crossOriginExtensionHost: 'true',
        workbenchBaseUrl: 'web-ide/public',
        extensionsHostBaseUrl: 'web-ide/public/vscode',
      });

      expect(() => validateCrossOriginExtensionHost()).toThrow(
        /VITE_EXTENSIONS_HOST_BASE_URL and VITE_WORKBENCH_BASE_URL must use different origins/,
      );
    });
  });
});
