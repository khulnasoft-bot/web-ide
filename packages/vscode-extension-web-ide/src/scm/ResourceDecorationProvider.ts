import * as vscode from 'vscode';
import { toFileDecoration } from './status';
import type { StatusViewModel } from './types';

export class ResourceDecorationProvider {
  readonly #decorationsDidChange: vscode.EventEmitter<vscode.Uri[]>;

  readonly #fileDecorations: Map<string, vscode.FileDecoration>;

  constructor() {
    this.#decorationsDidChange = new vscode.EventEmitter();

    this.#fileDecorations = new Map();
  }

  update(statusVms: StatusViewModel[]) {
    this.#fileDecorations.clear();
    statusVms.forEach(statusVm => {
      this.#fileDecorations.set(statusVm.uri.toString(), toFileDecoration(statusVm));
    });

    this.#decorationsDidChange.fire(statusVms.map(x => x.uri));
  }

  createVSCodeDecorationProvider(): vscode.FileDecorationProvider {
    return {
      onDidChangeFileDecorations: this.#decorationsDidChange.event,
      provideFileDecoration: (uri: vscode.Uri) => this.#fileDecorations.get(uri.toString()),
    };
  }
}
