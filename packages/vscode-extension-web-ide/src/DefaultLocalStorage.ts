import type * as vscode from 'vscode';
import type { LocalStorage } from './types';

export default class DefaultLocalStorage implements LocalStorage {
  readonly vscodeLocalStorage: vscode.Memento;

  constructor(vscodeLocalStorage: vscode.Memento) {
    this.vscodeLocalStorage = vscodeLocalStorage;
  }

  keys(): readonly string[] {
    return this.vscodeLocalStorage.keys();
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    if (defaultValue !== undefined) {
      return this.vscodeLocalStorage.get<T>(key, defaultValue);
    }

    return this.vscodeLocalStorage.get<T>(key);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(key: string, value: any): Thenable<void> {
    return this.vscodeLocalStorage.update(key, value);
  }
}
