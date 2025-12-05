import type { AuthProvider } from '@gitlab/gitlab-api-client';
import { createMediatorCommandExecutor } from './factory';
import type { MediatorCommandExecutor } from './types';

// note: Singletons are not cool, but this is an iterative step for us to migrate away
//       from globally registered mediator commands.
let defaultExecutor: MediatorCommandExecutor | undefined;

export const setupMediatorCommandExecutor = async (apiAuthProvider: AuthProvider) => {
  defaultExecutor = await createMediatorCommandExecutor(apiAuthProvider);
};

export const executeMediatorCommand = async <T = unknown>(
  commandId: string,
  ...args: unknown[]
): Promise<T> => {
  if (!defaultExecutor) {
    throw new Error(
      'MediatorCommandExecutor not found! Expected setupMediatorCommandExecutor to have been called.',
    );
  }

  return defaultExecutor.execute(commandId, ...args);
};
