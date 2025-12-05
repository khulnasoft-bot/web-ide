import { defineType } from '../src/amd/types';

interface DefineProvider {
  define: defineType;
}

// why: This is needed for shim() to work
declare global {
  interface Window extends DefineProvider {}
}

/**
 * This class mocks an AMD environment for testing purposes.
 *
 * Usage:
 *
 * ```javascript
 * const amd = new MockAMDEnvironment();
 * amd.shim();
 *
 * beforeEach(() => {
 *   amd.define('/required/dependency', { ... });
 * });
 * ```
 */
class MockAMDEnvironment implements DefineProvider {
  private readonly modules: Map<string, any>;

  constructor() {
    this.modules = new Map();
  }

  define<T, Deps extends any[] = []>(
    path: string,
    ...args: [string[], (...deps: Deps) => T] | [(...deps: Deps) => T]
  ) {
    let dependencies: string[];
    let callback: Function;

    if (args.length === 2) {
      [dependencies, callback] = args;
    } else {
      dependencies = [];
      [callback] = args;
    }

    // what: Let's fail early if we are expecting undefined dependencies
    const missingDependencies = dependencies.filter(path => !this.modules.has(path));
    if (missingDependencies.length) {
      const missingDependenciesStr = missingDependencies.map(x => `  - ${x}`).join('\n');
      throw new Error(
        `Some dependencies have not been defined yet. Are you missing a call to \`define("path/to/module", ...)\` for the following:\n\n${missingDependenciesStr}`,
      );
    }

    const dependencyObjs = dependencies.map(path => this.modules.get(path));
    const newModuleObj = callback(...dependencyObjs);

    this.modules.set(path, newModuleObj);
  }

  /**
   * Clear all previously defined modules.
   */
  cleanup() {
    this.modules.clear();
  }

  /**
   * Shim `define` for this MockAMDEnvironment into the global scope.
   */
  shim() {
    window.define = this.define.bind(this);
  }
}

export const useMockAMDEnvironment = () => new MockAMDEnvironment();
