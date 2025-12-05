import { OAuthStateBroadcaster } from '../src/types';

export const createBroadcasterStub = (): OAuthStateBroadcaster => ({
  dispose: jest.fn(),
  notifyTokenChange: jest.fn(),
  onTokenChange: jest.fn(),
});
