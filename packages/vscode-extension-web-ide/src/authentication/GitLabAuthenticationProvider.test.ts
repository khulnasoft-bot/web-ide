import type * as vscode from 'vscode';
import { createConfig } from '@khulnasoft/utils-test';
import type { WebIdeConfig } from '@khulnasoft/web-ide-types';
import { GitLabAuthenticationProvider } from './GitLabAuthenticationProvider';

const TEST_CONFIG: WebIdeConfig = {
  ...createConfig(),
  username: 'root',
};
const TEST_TOKEN = 'test-secret-token';
const TEST_NEW_TOKEN = 'new-secret-token';

const EXPECTED_SESSION = {
  accessToken: TEST_TOKEN,
  account: {
    id: 'current-user',
    label: 'root',
  },
  id: 'current-user',
  scopes: ['api'],
};

describe('authentication/GitLabAuthenticationProvider', () => {
  let subject: GitLabAuthenticationProvider;
  let changeSpy: jest.Mock<void, [vscode.AuthenticationProviderAuthenticationSessionsChangeEvent]>;

  beforeEach(() => {
    changeSpy = jest.fn();

    subject = new GitLabAuthenticationProvider(TEST_CONFIG, TEST_TOKEN);
    subject.onDidChangeSessions(changeSpy);
  });

  describe('default', () => {
    it('does not trigger change event', () => {
      expect(changeSpy).not.toHaveBeenCalled();
    });

    it('getSessions - returns initial sessions', async () => {
      const actual = await subject.getSessions();

      expect(actual).toEqual([EXPECTED_SESSION]);
    });

    it('createSession - rejects because it should never be called', async () => {
      await expect(subject.createSession()).rejects.toThrowError(
        new Error('Cannot create new Web IDE sessions. Expected createSession to never be called.'),
      );
    });

    it('removeSession - rejects because it should never be called', async () => {
      await expect(subject.removeSession()).rejects.toThrowError(
        new Error(
          'Cannot remove authenticated Web IDE session. Expected removeSession to never be called.',
        ),
      );
    });
  });

  describe('when updateToken is called', () => {
    beforeEach(() => {
      subject.updateToken(TEST_NEW_TOKEN);
    });

    it('triggers onDidChangeSessions event', () => {
      expect(changeSpy).toHaveBeenCalledTimes(1);
      expect(changeSpy).toHaveBeenCalledWith({
        added: [],
        removed: [],
        changed: [
          {
            ...EXPECTED_SESSION,
            accessToken: TEST_NEW_TOKEN,
          },
        ],
      });
    });

    it('getSessions - returns updated sessions', async () => {
      const actual = await subject.getSessions();

      expect(actual).toEqual([
        {
          ...EXPECTED_SESSION,
          accessToken: TEST_NEW_TOKEN,
        },
      ]);
    });
  });

  describe('when dispose is called', () => {
    beforeEach(() => {
      subject.dispose();
    });

    it('disposes onDidChaneSessions event', () => {
      subject.updateToken(TEST_NEW_TOKEN);

      expect(changeSpy).not.toHaveBeenCalled();
    });
  });

  describe('when created without token', () => {
    beforeEach(() => {
      subject = new GitLabAuthenticationProvider(TEST_CONFIG);
    });

    it('does not have any sessions', async () => {
      const actual = await subject.getSessions();

      expect(actual).toEqual([]);
    });

    describe('when updateToken is called', () => {
      beforeEach(() => {
        subject.updateToken(TEST_NEW_TOKEN);
      });

      it('has session', async () => {
        const actual = await subject.getSessions();

        expect(actual).toEqual([
          {
            ...EXPECTED_SESSION,
            accessToken: TEST_NEW_TOKEN,
          },
        ]);
      });
    });
  });
});
