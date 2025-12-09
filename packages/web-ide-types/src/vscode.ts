/**
 * This file contains types that reference VSCode internal types.
 */

// This should mirror the IProductConfiguration['extensionsGallery'] from VSCode
// https://gitlab.com/khulnasoft/web-ide-vscode-fork/-/blob/0e16324eff7e45a43223f9c11dafa1b3768d3174/src/vs/base/common/product.ts#L95
export interface VscodeExtensionsGallerySettings {
  readonly serviceUrl: string;
  readonly servicePPEUrl?: string;
  readonly searchUrl?: string;
  readonly itemUrl: string;
  readonly publisherUrl: string;
  readonly resourceUrlTemplate: string;
  readonly controlUrl: string;
  readonly nlsBaseUrl: string;
}

// LogLevel https://gitlab.com/khulnasoft/web-ide-vscode-fork/-/blob/main/src/vs/platform/log/common/log.ts
export enum LogLevel {
  Trace,
  Debug,
  Info,
  Warning,
  Error,
  Critical,
  Off,
}

/**
 * This type contains the commit sha that points
 * to the version of KhulnaSoft VSCode Fork used in the Web IDE
 * and the build quality ('stable' or 'insiders').
 *
 * This type is used by the global constant VSCodeInfo
 * declared in the file packages/web-ide-types/global.d.ts.
 */
export interface VSCodeInfo {
  readonly commit: string;
  readonly quality: string;
}
