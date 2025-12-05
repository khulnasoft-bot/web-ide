/*
 * Configuration utility for AMD require.js module loader
 * Provides a typed wrapper around the global require.config function.
 *
 * workaround: The reason for the expression `require as unknown as Require` is that in CI,
 * jest tests fail because Typescript can't detect the Require type augmentation that
 * implemented in `packages/vscode-bootstrap/src/amd/global.d.ts`.
 *
 * Instead, it's picking the Require type definition coming from the @types/node  library.
 */
export const configRequire = (config: unknown) => (require as unknown as Require).config(config);
