/**
 * This method wraps the given function and returns one that ignores calls
 * while the current one is pending.
 *
 * Only the *latest* call is added to the "queue" and is run once the
 * current one is resolved or rejected.
 */
export const queueAsyncCalls = <TArgs extends unknown[]>(
  fn: (...args: TArgs) => Promise<void>,
): ((...args: TArgs) => void) => {
  let queuedArgs: TArgs | undefined;
  let isRunning = false;

  const handleQueuedCall = async (nextArgs: TArgs) => {
    if (isRunning) {
      queuedArgs = nextArgs;
    } else {
      isRunning = true;
      try {
        await fn(...nextArgs);
      } catch {
        // Intentionally ignore error. Promises passed to here need to handle their own errors
      }
      isRunning = false;

      if (queuedArgs) {
        const args = queuedArgs;
        queuedArgs = undefined;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        handleQueuedCall(args);
      }
    }
  };

  return (...args: TArgs) => handleQueuedCall(args);
};
