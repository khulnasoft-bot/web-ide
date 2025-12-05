import { createFakePartial } from '@gitlab/utils-test';
import { DefaultAuthProvider } from '@gitlab/gitlab-api-client';
import { DeprecatedMediatorCommandExecutor } from './DeprecatedMediatorCommandExecutor';
import type { SecureMediatorCommandExecutor } from './SecureMediatorCommandExecutor';
import { createSecureMediatorCommandExecutor } from './SecureMediatorCommandExecutor';
import { createMediatorCommandExecutor } from './factory';

jest.mock('./SecureMediatorCommandExecutor');

const TEST_SECURE_EXECUTOR = createFakePartial<SecureMediatorCommandExecutor>({});

describe('mediator/executor/factory', () => {
  beforeEach(() => {
    jest.mocked(createSecureMediatorCommandExecutor).mockResolvedValue(TEST_SECURE_EXECUTOR);
  });

  it('creates deprecated executor when auth provider has no token', async () => {
    const actual = await createMediatorCommandExecutor(new DefaultAuthProvider(''));

    expect(actual).toBeInstanceOf(DeprecatedMediatorCommandExecutor);
  });

  it('creates secure mediator executor when auth provider has token', async () => {
    const authProvider = new DefaultAuthProvider('token');
    const actual = await createMediatorCommandExecutor(authProvider);

    expect(actual).toBe(TEST_SECURE_EXECUTOR);
    expect(createSecureMediatorCommandExecutor).toHaveBeenCalledWith(authProvider);
  });
});
