import type { defineFunc } from './types';

declare global {
  interface Require {
    config(options: unknown): void;
  }
  const define: defineFunc;
  const require: Require;
}
