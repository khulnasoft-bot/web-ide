// why: We need to shim setImmediate for browserfs's LockedFS to work.
//      https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/generic/mutex.ts#L33
//
//      BrowserFS shim is a bit outdated, so let's use a more modern approach.
//      https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/generic/setImmediate.ts
if (!global.setImmediate) {
  // why: We use a factory function like this because NodeJS types for setImmediate
  //      expect a property `__promisify__`. This isn't actually used, but
  //      makes TypeScript happy.
  global.setImmediate = (function setImmediateShimFactory() {
    function setImmediateShim<TArgs extends unknown[]>(
      callback: (...callbackArgs: TArgs) => void,
      ...args: TArgs
    ) {
      // TODO: Investigate if we need another implementation for setImmediate.
      //       There's a **huge** performance win with `queueMicrotask` compared
      //       to `_.defer`.
      queueMicrotask(() => callback.call(null, ...args));

      return <NodeJS.Immediate>{};
    }

    setImmediateShim.__promisify__ = () => {
      throw new Error('Not supported!');
    };

    return setImmediateShim;
  })();
}
