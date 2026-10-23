import './global.d';

export * from './config';
export * from './error';
export * from './extensionMarketplace';
export * from './instrumentation';
export * from './vscode';
export * from './features';

/**
 * A constract for objects that hold resources that should be
 * released upon destruction.
 */
export interface Disposable {
  dispose: () => void;
}

/**
 * This is the type we return from the `start` functions of the `@gitlab/web-ide` package
 */
export interface WebIde extends Disposable {
  /**
   * Promise that resolves when the Web IDE is actually ready.
   *
   * The Web IDE is ready when the runtime and relevant file tree is
   * loaded and ready for the user's interaction.
   */
  readonly ready: Promise<void>;
}
