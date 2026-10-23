import type { AuthHeadersProvider, AuthProvider } from '@gitlab/gitlab-api-client';
import type { AuthType } from '@gitlab/web-ide-types';

import {
  createOAuthHeadersProvider,
  createPrivateTokenHeadersProvider,
} from './DefaultAuthHeadersProvider';

// https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#union-exhaustiveness-checking
function assertNever(x: never): never {
  throw new Error(`assertNever - Unexpected object: ${x}`);
}

export const getAuthHeadersProvider = (
  authType?: AuthType,
  auth?: AuthProvider,
): AuthHeadersProvider | undefined => {
  // note: !auth implies !config.auth, but I'm checking for both to make TS happy
  if (!auth || !authType) {
    return undefined;
  }

  switch (authType) {
    case 'oauth':
      return createOAuthHeadersProvider(auth);
    case 'token':
      return createPrivateTokenHeadersProvider(auth);
    default:
      return assertNever(authType);
  }
};
