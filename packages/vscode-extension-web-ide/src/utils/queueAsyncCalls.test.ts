import { queueAsyncCalls } from './queueAsyncCalls';

describe('utils/queueAsyncCalls', () => {
  let resolveLastCall: () => void;
  let spy: jest.Mock<Promise<void>, [string]>;

  beforeEach(() => {
    spy = jest.fn().mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveLastCall = resolve;
        }),
    );
  });

  it('ignores unrun args until the current call finishes running', async () => {
    const queuedFn = queueAsyncCalls(spy);

    queuedFn('A');
    queuedFn('B');
    queuedFn('C');
    queuedFn('D');
    await new Promise(process.nextTick);

    expect(spy.mock.calls).toEqual([['A']]);

    // Finish the 'A' call, which will automatically call the last 'D' arg
    resolveLastCall();
    await new Promise(process.nextTick);
    queuedFn('E');
    queuedFn('F');

    // note: 'E' and 'F' are not called yet because 'D' is still pending
    expect(spy.mock.calls).toEqual([['A'], ['D']]);

    // Finish the 'D' call
    resolveLastCall();
    await new Promise(process.nextTick);

    expect(spy.mock.calls).toEqual([['A'], ['D'], ['F']]);
  });
});
