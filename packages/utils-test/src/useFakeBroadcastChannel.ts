import { FakeBroadcastChannel } from './FakeBroadcastChannel';

// We have to use the jest.mock route to get an actual class mock
jest.mock('./FakeBroadcastChannel');

export const useFakeBroadcastChannel = () => {
  let oldBroadcastChannel: { new (name: string): BroadcastChannel };

  beforeAll(() => {
    oldBroadcastChannel = global.BroadcastChannel;
    global.BroadcastChannel = FakeBroadcastChannel;
  });

  afterAll(() => {
    global.BroadcastChannel = oldBroadcastChannel;
  });
};
