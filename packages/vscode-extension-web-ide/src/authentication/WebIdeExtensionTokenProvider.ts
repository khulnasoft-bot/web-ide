import type * as vscode from 'vscode';
import type { AuthProvider } from '@gitlab/gitlab-api-client';

export class WebIdeExtensionTokenProvider implements AuthProvider {
  #context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.#context = context;
  }

  async getToken(): Promise<string> {
    return (await this.#context.secrets.get('auth_token')) || '';
  }
}
