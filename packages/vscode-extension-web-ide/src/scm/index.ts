import * as vscode from 'vscode';
import { debounce } from 'lodash';
import type { WebIdeConfig } from '@khulnasoft/web-ide-types';
import type { SourceControlFileSystem, SourceControlSystem } from '@khulnasoft/web-ide-fs';
import type { GitLabProject, GitLabRef } from '@khulnasoft/vscode-mediator-commands';
import type { DefaultGitLabClient } from '@gitlab/gitlab-api-client';
import {
  COMMIT_AMEND_AND_FORCE_PUSH_COMMAND_ID,
  COMMIT_AND_FORCE_PUSH_COMMAND_ID,
  COMMIT_COMMAND_ID,
  SCM_SCHEME,
} from '../constants';
import { anyEvent } from '../utils';
import { SourceControlFileSystemProvider } from '../vscode/SourceControlFileSystemProvider';
import * as commitCommand from './commit/command';
import { createSourceControlViewModel } from './create';
import { preventUnload } from '../mediator';
import type { LocalStorage } from '../types';

const initializeScmFileSystemProvider = (
  disposables: vscode.Disposable[],
  sourceControlFs: SourceControlFileSystem,
) => {
  disposables.push(
    vscode.workspace.registerFileSystemProvider(
      SCM_SCHEME,
      new SourceControlFileSystemProvider(sourceControlFs),
      {
        isReadonly: true,
      },
    ),
  );
};

const createVSCodeFSWatcher = (disposables: vscode.Disposable[]) => {
  // FileSystemWatcher Example https://sourcegraph.com/github.com/microsoft/vscode@3bdea7784d6ef67722967a4cd51179b30e9a1013/-/blob/extensions/git/src/model.ts?L120
  const fsWatcher = vscode.workspace.createFileSystemWatcher('**');
  disposables.push(fsWatcher);

  return anyEvent(fsWatcher.onDidChange, fsWatcher.onDidCreate, fsWatcher.onDidDelete);
};

const onFilesChanged = (disposables: vscode.Disposable[], callback: () => void) => {
  const watcher = createVSCodeFSWatcher(disposables);

  watcher(debounce(callback, 200), null, disposables);
};

export interface ScmSetupOptions {
  sourceControl: SourceControlSystem;
  sourceControlFs: SourceControlFileSystem;
  localStorage: LocalStorage;
  repoRoot: string;
  ref: GitLabRef;
  branchMergeRequestUrl: string;
  project: GitLabProject;
  config: WebIdeConfig;
  apiClient: DefaultGitLabClient;
}

export const initializeSourceControl = async (
  disposables: vscode.Disposable[],
  {
    sourceControl,
    localStorage,
    sourceControlFs,
    repoRoot,
    ref,
    project,
    branchMergeRequestUrl,
    config,
    apiClient,
  }: ScmSetupOptions,
) => {
  initializeScmFileSystemProvider(disposables, sourceControlFs);

  const viewModel = createSourceControlViewModel(disposables, repoRoot, ref, project, config);
  let hasStatus = false;

  // On initialization there are no changes, so we should reset `preventUnload`
  await preventUnload({ shouldPrevent: false });

  onFilesChanged(disposables, async () => {
    const status = await sourceControl.status();

    viewModel.update(status);

    const newHasStatus = Boolean(status.length);

    if (newHasStatus !== hasStatus) {
      hasStatus = newHasStatus;

      await preventUnload({ shouldPrevent: hasStatus });
    }
  });

  disposables.push(
    // Commit command
    vscode.commands.registerCommand(
      COMMIT_COMMAND_ID,
      commitCommand.factory({
        viewModel,
        localStorage,
        ref,
        branchMergeRequestUrl,
        project,
        apiClient,
      }),
    ),
    // Commit and Force Push command
    vscode.commands.registerCommand(
      COMMIT_AND_FORCE_PUSH_COMMAND_ID,
      commitCommand.factory({
        viewModel,
        localStorage,
        ref,
        branchMergeRequestUrl,
        project,
        force: true,
        amend: false,
        apiClient,
      }),
    ),
    // Commit (Amend) and Force Push command
    vscode.commands.registerCommand(
      COMMIT_AMEND_AND_FORCE_PUSH_COMMAND_ID,
      commitCommand.factory({
        viewModel,
        localStorage,
        ref,
        branchMergeRequestUrl,
        project,
        force: true,
        amend: true,
        apiClient,
      }),
    ),
  );
};
