import * as vscode from 'vscode';
import type { DefaultGitLabClient } from '@khulnasoft/khulnasoft-api-client';
import { RELOAD_COMMAND_ID } from '../constants';
import type { InitializeOptions } from '../types';
import { log } from '../utils';

type ReloadCallback = (
  context: vscode.ExtensionContext,
  apiClient: DefaultGitLabClient,
  disposables: vscode.Disposable[],
  progress: vscode.Progress<{ increment: number; message: string }>,
  options: InitializeOptions,
) => Promise<unknown>;

export interface ReloadCommandParams {
  ref: string;
  projectPath: string;
  pageReload: boolean;
}
/**
 * Registers the "reload" VSCode command.
 *
 * PLEASE NOTE: This command is special since it actually mutates the
 * given disposables collection. For this reason there's some sensitivity
 * to *when* and *how* this function is registered.
 *
 * TODO: Refactor registering commands so that they can follow a common pattern
 * and all live in `commands/index.ts`.
 *
 * @param disposables
 * @param reloadFn Function to call when reload is triggered
 * @returns
 */
export const registerReloadCommand = (
  context: vscode.ExtensionContext,
  apiClient: DefaultGitLabClient,
  disposables: vscode.Disposable[],
  reloadFn: ReloadCallback,
) =>
  vscode.commands.registerCommand(
    RELOAD_COMMAND_ID,
    ({ ref, projectPath, pageReload }: ReloadCommandParams) => {
      log.info(`Reloading Web IDE state from ${ref}`);

      // Dispose everything
      disposables.forEach(x => {
        x.dispose();
      });
      disposables.splice(0, disposables.length);

      return vscode.window.withProgress(
        {
          cancellable: false,
          location: vscode.ProgressLocation.Notification,
        },
        progress =>
          reloadFn(context, apiClient, disposables, progress, {
            ref,
            projectPath,
            isReload: true,
            pageReload,
          }),
      );
    },
  );
