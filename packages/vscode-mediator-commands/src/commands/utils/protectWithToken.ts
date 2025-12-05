export const protectWithToken =
  <T extends unknown[], TReturn>(secretToken: string, fn: (...args: T) => TReturn) =>
  (tokenArg: string, ...args: T) => {
    if (tokenArg === secretToken) {
      return fn(...args);
    }

    return Promise.reject(new Error(`Token invalid`));
  };
