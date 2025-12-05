import * as vscode from 'vscode';
import { FS_SCHEME } from '../constants';

// why: Export for testing purposes
export const FILE_DECORATION: vscode.FileDecoration2 = {
  badge: new vscode.ThemeIcon('git-pull-request'),
  propagate: false,
  tooltip: 'Part of merge request changes',
};

export class MergeRequestFileDecorationProvider implements vscode.FileDecorationProvider {
  readonly #mrChanges: ReadonlySet<string>;

  constructor(mrChanges: ReadonlySet<string>) {
    this.#mrChanges = mrChanges;
  }

  provideFileDecoration(uri: vscode.Uri): vscode.ProviderResult<vscode.FileDecoration> {
    if (uri.scheme === FS_SCHEME && this.#mrChanges.has(uri.path)) {
      // why: Let's clone for defensiveness
      const decoration = { ...FILE_DECORATION };

      // why: This `as FileDecoration` is the way this proposed API is handled in other extensions
      // https://sourcegraph.com/github.com/microsoft/vscode-pull-request-github@93129e3085e1a45aaf5a4f30f11a2333cca85e3b/-/blob/src/view/prStatusDecorationProvider.ts?L51:5
      return decoration as vscode.FileDecoration;
    }

    return undefined;
  }
}
