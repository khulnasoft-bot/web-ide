import { FakeMessageChannel } from './FakeMessageChannel';

export const useFakeMessageChannel = () => {
  let oldMessageChannel: typeof global.MessageChannel;

  beforeAll(() => {
    oldMessageChannel = global.MessageChannel;

    global.MessageChannel = FakeMessageChannel;
  });

  afterAll(() => {
    global.MessageChannel = oldMessageChannel;
  });
};
