import { COMMAND_MEDIATOR_TOKEN } from '@khulnasoft/web-ide-interop';
import { memoize } from 'lodash';
import * as vscode from 'vscode';
import type { MediatorCommandExecutor } from './types';

const getMediatorToken = memoize(() =>
  vscode.commands.executeCommand<string>(COMMAND_MEDIATOR_TOKEN),
);

/**
 * This MediatorCommandExecutor executes the globally registered mediator commands.
 *
 * Globally registering mediator commands is not secure and disabled when OAuth is enabled.
 *
 * @deprecated this will be removed shortly as we move away from mediator commands
 */
export class DeprecatedMediatorCommandExecutor implements MediatorCommandExecutor {
  // eslint-disable-next-line class-methods-use-this
  async execute<T = unknown>(commandId: string, ...args: unknown[]): Promise<T> {
    const token = await getMediatorToken();

    return vscode.commands.executeCommand<T>(commandId, token, ...args);
  }
}
