import type { WebIdeConfig } from '@khulnasoft/web-ide-types';
import * as vscode from 'vscode';
import { log } from '../utils';

const DEFAULT_SESSION_ID = 'current-user';
const DEFAULT_SESSION_LABEL = 'Current User';

export class GitLabAuthenticationProvider
  implements vscode.AuthenticationProvider, vscode.Disposable
{
  readonly #onDidChangeSessionsEventEmitter: vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>;

  readonly #username?: string;

  #session?: vscode.AuthenticationSession;

  constructor(config: WebIdeConfig, token?: string) {
    this.#onDidChangeSessionsEventEmitter =
      new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();

    this.#username = config.username;
    this.#session = token ? this.#createAuthenticationSession(token) : undefined;
  }

  dispose() {
    this.#onDidChangeSessionsEventEmitter.dispose();
  }

  get onDidChangeSessions() {
    return this.#onDidChangeSessionsEventEmitter.event;
  }

  updateToken(token: string) {
    log.debug('GitLabAuthenticationProvider - New token received. Updating token.');

    this.#session = this.#createAuthenticationSession(token);

    this.#onDidChangeSessionsEventEmitter.fire({
      added: [],
      removed: [],
      changed: [this.#session],
    });
  }

  getSessions(): Thenable<readonly vscode.AuthenticationSession[]> {
    if (this.#session) {
      return Promise.resolve([this.#session]);
    }

    return Promise.resolve([]);
  }

  // eslint-disable-next-line class-methods-use-this
  createSession(): Thenable<vscode.AuthenticationSession> {
    return Promise.reject(
      new Error('Cannot create new Web IDE sessions. Expected createSession to never be called.'),
    );
  }

  // eslint-disable-next-line class-methods-use-this
  removeSession(): Promise<void> {
    return Promise.reject(
      new Error(
        'Cannot remove authenticated Web IDE session. Expected removeSession to never be called.',
      ),
    );
  }

  #createAuthenticationSession(token: string): vscode.AuthenticationSession {
    return {
      accessToken: token,
      account: { id: DEFAULT_SESSION_ID, label: this.#username || DEFAULT_SESSION_LABEL },
      id: DEFAULT_SESSION_ID,
      scopes: ['api'],
    };
  }
}
