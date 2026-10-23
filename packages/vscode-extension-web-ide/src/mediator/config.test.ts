import type { ExtensionContext, SecretStorage } from 'vscode';
import { createWebIdeExtensionConfig, createFakePartial } from '@gitlab/utils-test';
import { getConfig, MSG_CONFIG_NOT_FOUND, MSG_CONFIG_NOT_JSON } from './config';
import { getExtensionContext } from '../context';

jest.mock('../context');

const TEST_CONFIG = createWebIdeExtensionConfig();

describe('vscode-extension-web-ide/mediator/config', () => {
  let configAsJson: undefined | string;

  beforeEach(() => {
    jest.mocked(getExtensionContext).mockReturnValue(
      createFakePartial<ExtensionContext>({
        secrets: createFakePartial<SecretStorage>({
          get(key: string) {
            return Promise.resolve(key === 'config' ? configAsJson : undefined);
          },
        }),
      }),
    );
  });

  afterEach(() => {
    // Clear memoized things to keep test determinism
    getConfig.cache.clear?.();
  });

  it('throws if config is not found', async () => {
    await expect(getConfig).rejects.toThrowError(MSG_CONFIG_NOT_FOUND);
  });

  it('throws if config is not valid JSON', async () => {
    configAsJson = 'Hello world!';

    await expect(getConfig).rejects.toThrowError(MSG_CONFIG_NOT_JSON);
  });

  it('returns config if found', async () => {
    configAsJson = JSON.stringify(TEST_CONFIG);

    const actual = await getConfig();

    expect(actual).toEqual(TEST_CONFIG);
  });

  it('is memoized', async () => {
    const secretsSpy = jest.spyOn(getExtensionContext().secrets, 'get');

    expect(secretsSpy).not.toHaveBeenCalled();

    const result1 = await getConfig();
    const result2 = await getConfig();

    expect(secretsSpy).toHaveBeenCalledTimes(1);
    expect(result1).toBe(result2);
  });
});
