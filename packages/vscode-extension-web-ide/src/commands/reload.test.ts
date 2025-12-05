import * as vscode from 'vscode';
import type { DefaultGitLabClient } from '@gitlab/gitlab-api-client';
import { createFakePartial } from '@gitlab/utils-test';
import { RELOAD_COMMAND_ID } from '../constants';
import { registerReloadCommand } from './reload';
import {
  createFakeCancellationToken,
  createFakeProgress,
  createFakeExtensionContext,
} from '../../test-utils/vscode';
import { executeCommand } from '../../test-utils/executeCommand';

const TEST_REF = 'new-branch-patch-123';

describe('commands/reload', () => {
  let disposeSpy: jest.Mock<void, [string]>;
  let disposables: vscode.Disposable[];
  let reloadFn: () => Promise<void>;
  let extensionContext: vscode.ExtensionContext;
  let disposeReloadCommand: vscode.Disposable;
  let apiClient: DefaultGitLabClient;

  beforeEach(() => {
    jest.mocked(vscode.commands.registerCommand).mockImplementation(() => ({ dispose: jest.fn() }));

    disposeSpy = jest.fn();
    disposables = [
      { dispose: () => disposeSpy('A') },
      { dispose: () => disposeSpy('B') },
      { dispose: () => disposeSpy('C') },
    ];
    apiClient = createFakePartial<DefaultGitLabClient>({
      fetchFromApi: jest.fn(),
      fetchBufferFromApi: jest.fn(),
    });
    reloadFn = jest.fn().mockImplementation(() => Promise.resolve());
    extensionContext = createFakeExtensionContext();
  });

  describe('registerReloadCommand', () => {
    beforeEach(() => {
      disposeReloadCommand = registerReloadCommand(
        extensionContext,
        apiClient,
        disposables,
        reloadFn,
      );
    });

    it('command is registered and added to disposables', () => {
      expect(disposeReloadCommand).toEqual(
        jest.mocked(vscode.commands.registerCommand).mock.results[0].value,
      );
    });

    it('does not call withProgress', () => {
      expect(vscode.window.withProgress).not.toHaveBeenCalled();
    });

    it('does not call disposables', () => {
      expect(disposeSpy).not.toHaveBeenCalled();
    });

    describe('when command is executed', () => {
      beforeEach(() => {
        executeCommand(RELOAD_COMMAND_ID, { ref: TEST_REF });
      });

      it('calls dispose on disposables and clears out array', () => {
        expect(disposeSpy.mock.calls.flatMap(x => x)).toEqual(['A', 'B', 'C']);
      });

      it('clears out disposables', () => {
        expect(disposables).toHaveLength(0);
      });

      it('creates vscode progress bar', () => {
        expect(vscode.window.withProgress).toHaveBeenCalledTimes(1);
        expect(vscode.window.withProgress).toHaveBeenCalledWith(
          {
            cancellable: false,
            location: vscode.ProgressLocation.Notification,
          },
          expect.any(Function),
        );
      });

      it('calls reload with progress', async () => {
        expect(reloadFn).not.toHaveBeenCalled();
        const progress = createFakeProgress();
        const cancellationToken = createFakeCancellationToken();

        const [, fn] = jest.mocked(vscode.window.withProgress).mock.calls[0];
        await fn(progress, cancellationToken);

        expect(reloadFn).toHaveBeenCalledWith(extensionContext, apiClient, disposables, progress, {
          ref: TEST_REF,
          isReload: true,
        });
      });
    });
  });
});
