import { createWebIdeExtensionConfig } from '@khulnasoft/utils-test';
import type { AuthProvider } from '@khulnasoft/khulnasoft-api-client';
import type { AuthenticationSessionInfo, ISecretStorageProvider } from '../types';
import { createDefaultSecretStorageProvider } from './factory';

const TEST_TOKEN = 'abc123';
const TEST_CUSTOM_KEY = 'custom-key';
const TEST_CUSTOM_VALUE = 'Lorem ipsum dolar sit amit.';
const TEST_CONFIG = createWebIdeExtensionConfig();

const EXPECTED_ACCOUNT: AuthenticationSessionInfo = {
  id: 'current-user',
  accessToken: TEST_TOKEN,
  providerId: 'khulnasoft-web-ide',
  canSignOut: false,
};

describe('vscode/secrets/factory', () => {
  // note: These tests should provide sufficient coverage for OverlaySecretStorageProvider
  describe('createDefaultSecretStorageProvider', () => {
    let authProvider: AuthProvider;
    let subject: ISecretStorageProvider;

    beforeEach(async () => {
      authProvider = {
        getToken: () => Promise.resolve(TEST_TOKEN),
      };
      subject = createDefaultSecretStorageProvider({ authProvider, config: TEST_CONFIG });

      // note: This provides coverage for "after set on custom key"
      await subject.set(TEST_CUSTOM_KEY, TEST_CUSTOM_VALUE);
    });

    it('has in-memory type', () => {
      expect(subject.type).toBe('in-memory');
    });

    it.each`
      key                                                                                | expectation
      ${JSON.stringify({ extensionId: 'gitlab.khulnasoft-web-ide', key: 'auth_token' })} | ${TEST_TOKEN}
      ${JSON.stringify({ extensionId: 'gitlab.khulnasoft-web-ide', key: 'config' })}     | ${JSON.stringify(TEST_CONFIG)}
      ${JSON.stringify({ extensionId: 'vim', key: 'auth_token' })}                       | ${undefined}
      ${'khulnasoft-web-ide.loginAccount'}                                               | ${JSON.stringify(EXPECTED_ACCOUNT)}
      ${TEST_CUSTOM_KEY}                                                                 | ${TEST_CUSTOM_VALUE}
      ${'dne'}                                                                           | ${undefined}
    `('get for key="$key", returns $expectation', async ({ key, expectation }) => {
      const result = await subject.get(key);

      expect(result).toBe(expectation);
    });

    describe('after set on expected auth_token key', () => {
      beforeEach(async () => {
        await subject.set(
          JSON.stringify({ extensionId: 'gitlab.khulnasoft-web-ide', key: 'auth_token' }),
          'new value',
        );
      });

      it('overwrites auth_token value', async () => {
        const result = await subject.get(
          JSON.stringify({ extensionId: 'gitlab.khulnasoft-web-ide', key: 'auth_token' }),
        );

        expect(result).toBe('new value');
      });
    });

    describe('after delete on expected auth_token key', () => {
      beforeEach(async () => {
        await subject.delete(
          JSON.stringify({ extensionId: 'gitlab.khulnasoft-web-ide', key: 'auth_token' }),
        );
      });

      it('does nothing', async () => {
        const result = await subject.get(
          JSON.stringify({ extensionId: 'gitlab.khulnasoft-web-ide', key: 'auth_token' }),
        );

        expect(result).toBe(TEST_TOKEN);
      });
    });

    describe('after delete of custom_key', () => {
      beforeEach(async () => {
        await subject.delete(TEST_CUSTOM_KEY);
      });

      it('deletes custom key', async () => {
        const result = await subject.get(TEST_CUSTOM_KEY);

        expect(result).toBeUndefined();
      });
    });
  });

  describe('createDefaultSecretStorageProvider without authProvider', () => {
    let subject: ISecretStorageProvider;

    beforeEach(async () => {
      subject = createDefaultSecretStorageProvider({ config: TEST_CONFIG });
    });

    it.each`
      key                                                                                | expectation
      ${JSON.stringify({ extensionId: 'gitlab.khulnasoft-web-ide', key: 'auth_token' })} | ${undefined}
      ${JSON.stringify({ extensionId: 'gitlab.khulnasoft-web-ide', key: 'config' })}     | ${JSON.stringify(TEST_CONFIG)}
      ${'khulnasoft-web-ide.loginAccount'}                                               | ${undefined}
    `('get for key="$key", returns $expectation', async ({ key, expectation }) => {
      const result = await subject.get(key);

      expect(result).toBe(expectation);
    });
  });
});
