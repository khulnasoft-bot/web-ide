import type { VSCodeInfo } from './vscode';

declare global {
  /**
   * This constant is set at build time by
   * an ESBuild "define" construct. See the file
   * scripts/build.base.js.
   *
   * In the test environment, the global is set
   * in Jest's globals configuration.
   */
  const VSCodeInfo: VSCodeInfo;
}
