import { DebouncedFunc } from 'lodash';

/**
 * Helpful utility that casts the given function to a DebouncedFunc
 *
 * ```typescript
 * getListeners().map(asDebouncedFunc).forEach(({ flush }) => flush());
 * ```
 *
 * @param func
 * @returns Array of DebouncedFunc
 */
export const asDebouncedFunc = <T extends (...args: unknown[]) => unknown>(func: unknown) =>
  func as DebouncedFunc<T>;
