import type { AuthProvider } from '@khulnasoft/khulnasoft-api-client';
import type { Command } from '@khulnasoft/vscode-mediator-commands';
import { createCommands } from '@khulnasoft/vscode-mediator-commands';
import type { MediatorCommandExecutor } from './types';
import { getConfig } from '../config';

/**
 * This MediatorCommandExecutor receives a reference to the commands it will execute from.
 *
 * These commands **are not** globally registered and are therefore "secure".
 */
export class SecureMediatorCommandExecutor implements MediatorCommandExecutor {
  readonly #commands: Map<string, Command>;

  constructor(commands: Command[]) {
    this.#commands = new Map();

    commands.forEach(command => {
      this.#commands.set(command.id, command);
    });
  }

  async execute<T = unknown>(commandId: string, ...args: unknown[]): Promise<T> {
    const command = this.#commands.get(commandId);

    if (!command) {
      throw new Error(`Secure mediator command "${commandId}" not found!`);
    }

    // TODO: When we move completely away from mediator commands, we won't need to cast this.
    // This is here to support the iterative move away from globally registering mediator commands.
    const handler = command.handler as (...args: unknown[]) => Promise<T>;
    const result = await handler(...args);

    return result;
  }
}

export const createSecureMediatorCommandExecutor = async (authProvider: AuthProvider) => {
  const config = await getConfig();

  const commands = await createCommands({
    config,
    auth: authProvider,
    bufferWrapper: buffer => ({ buffer }),
    // why: We don't need the mediator token protection since these are not globally registered
    skipProtection: true,
  });

  return new SecureMediatorCommandExecutor(commands);
};
