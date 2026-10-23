import type { AuthProvider } from '@gitlab/gitlab-api-client';
import { log } from '../../utils';
import { DeprecatedMediatorCommandExecutor } from './DeprecatedMediatorCommandExecutor';
import { createSecureMediatorCommandExecutor } from './SecureMediatorCommandExecutor';
import type { MediatorCommandExecutor } from './types';

export const createMediatorCommandExecutor = async (
  apiAuthProvider: AuthProvider,
): Promise<MediatorCommandExecutor> => {
  const token = await apiAuthProvider.getToken();

  // what: If there's no token, we actually don't support auth within the extension
  if (!token) {
    log.debug('No token found. Using deprecated mediator command executor.');
    return new DeprecatedMediatorCommandExecutor();
  }

  log.debug('Token found. Using secure mediator command executor.');
  return createSecureMediatorCommandExecutor(apiAuthProvider);
};
