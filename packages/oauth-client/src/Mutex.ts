/**
 * Lovingly inspired by https://github.com/mgtitimoli/await-mutex/blob/d070ae051d4b9b221b2ad1186754a2b8696d813c/src/mutex.js
 */
export class Mutex {
  #locking: Promise<unknown>;

  constructor() {
    this.#locking = Promise.resolve();
  }

  lock() {
    let unlockNext: () => void;

    const nextLock = new Promise(resolve => {
      unlockNext = () => resolve(undefined);
    });

    // We will return our unlock hook after the current `#locking` promise chain resolves
    const waitForPastLocks = this.#locking.then(() => unlockNext);

    // Add our `nextLock` to the current `#locking` promise chain
    this.#locking = this.#locking.then(() => nextLock);

    return waitForPastLocks;
  }
}
