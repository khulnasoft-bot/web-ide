import { isExtensionsMarketplaceEnabled } from './isExtensionsMarketplaceEnabled';

describe('isExtensionsMarketplaceEnabled', () => {
  it.each`
    config                                                                                   | result
    ${{ crossOriginExtensionHost: true, extensionMarketplaceSettings: { enabled: true } }}   | ${true}
    ${{ crossOriginExtensionHost: false, extensionMarketplaceSettings: { enabled: true } }}  | ${false}
    ${{ crossOriginExtensionHost: true, extensionMarketplaceSettings: { enabled: false } }}  | ${false}
    ${{ crossOriginExtensionHost: false, extensionMarketplaceSettings: { enabled: false } }} | ${false}
  `('when web ide config is $config, then $result is returned', ({ config, result }) => {
    expect(isExtensionsMarketplaceEnabled(config)).toBe(result);
  });
});
