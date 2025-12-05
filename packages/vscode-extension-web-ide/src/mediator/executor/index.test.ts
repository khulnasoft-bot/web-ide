import { createFakePartial } from '@gitlab/utils-test';
import { NOOP_AUTH_PROVIDER } from '@gitlab/gitlab-api-client';
import { createMediatorCommandExecutor } from './factory';
import { setupMediatorCommandExecutor, executeMediatorCommand } from './index';
import type { MediatorCommandExecutor } from './types';

jest.mock('./factory');

describe('mediator/executor/index', () => {
  let mediatorCommandExecutor: MediatorCommandExecutor;

  beforeEach(() => {
    mediatorCommandExecutor = createFakePartial<MediatorCommandExecutor>({
      execute: jest.fn(),
    });
    jest.mocked(createMediatorCommandExecutor).mockResolvedValueOnce(mediatorCommandExecutor);
  });

  describe('executeMediatorCommand', () => {
    it('throws if setupExecutorMediatorCommand not called', async () => {
      await expect(executeMediatorCommand('test', 'test')).rejects.toThrowError(
        'MediatorCommandExecutor not found! Expected setupMediatorCommandExecutor to have been called.',
      );
    });

    it('when setup has been called, calls execute on the executor', async () => {
      await setupMediatorCommandExecutor(NOOP_AUTH_PROVIDER);

      await executeMediatorCommand('test', 'test');

      expect(mediatorCommandExecutor.execute).toHaveBeenCalledWith('test', 'test');
    });
  });

  describe('setupMediatorCommandExecutor', () => {
    it('calls createMediatorCommandExecutor with the auth provider', async () => {
      await setupMediatorCommandExecutor(NOOP_AUTH_PROVIDER);

      expect(createMediatorCommandExecutor).toHaveBeenCalledWith(NOOP_AUTH_PROVIDER);
    });
  });
});
