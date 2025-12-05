import { waitForPromises } from '@gitlab/utils-test';
import { waitForMessage } from './waitForMessage';

const TEST_MESSAGE = 'test-msg';

describe('utils/waitForMessage', () => {
  it('returns promise that resolves when message passes predicate', async () => {
    const spy = jest.fn();

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    waitForMessage(x => x === TEST_MESSAGE).then(spy);

    expect(spy).not.toHaveBeenCalled();

    window.postMessage('bar', '*');
    window.postMessage('foo', '*');
    // wait for promises since postMessage is async
    await waitForPromises();

    expect(spy).not.toHaveBeenCalled();

    window.postMessage(TEST_MESSAGE, '*');
    window.postMessage(TEST_MESSAGE, '*');
    window.postMessage(TEST_MESSAGE, '*');
    // wait for promises since postMessage is async
    await waitForPromises();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
