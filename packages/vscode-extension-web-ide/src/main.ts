import * as vscode from 'vscode';
import type { WebIDEExtension } from '@khulnasoft/web-ide-interop';
import { createSystems, DefaultFileList } from '@khulnasoft/web-ide-fs';
import type { DefaultGitLabClient } from '@gitlab/gitlab-api-client';
import { createGitLabClient } from '@gitlab/gitlab-api-client-factory';
import type { FileSystem } from '@khulnasoft/web-ide-fs';
import { GitLabFileSearchProvider } from './vscode/GitLabFileSearchProvider';
import { start, setupMediatorCommandExecutor, getConfig, updateWebIdeContext } from './mediator';
import { GitLabFileContentProvider } from './GitLabFileContentProvider';
import { DefaultFileSearcher } from './FileSearcher';
import { registerCommands } from './commands';
import { initializeSourceControl } from './scm';
import { FS_SCHEME, OUTPUT_CHANNEL_NAME, WEB_IDE_READY_CONTEXT_ID } from './constants';
import { registerReloadCommand } from './commands/reload';
import { initBranchStatusBarItem } from './ui';
import { showCannotPushCodeWarning } from './ui/showCannotPushCodeWarning';
import { initMergeRequestContext } from './initMergeRequestContext';
import type { InitializeOptions } from './types';
import DefaultLocalStorage from './DefaultLocalStorage';
import { openWalkthrough } from './openWalkthrough';
import { openInitFile } from './openInitFile';
import { setDefaultLogWriter } from './utils';
import { OutputChannelLogWriter } from './vscode/OutputChannelLogWriter';
import { registerShowLogsCommand } from './commands/showLogs';
import { initExtensionContext } from './context';
import { registerAuthenticationProvider, WebIdeExtensionTokenProvider } from './authentication';
import { setupExtensionMarketplaceDisabledView } from './extensionMarketplace';
import { setupThirdPartyExtensions } from './thirdPartyExtensions';
import { GitLabFileSystemProvider } from './vscode/GitLabFileSystemProvider';
import { showSecurityWarning } from './showSecurityWarning';

const MSG_INITIALIZING = 'Initializing GitLab Web IDE...';
const MSG_LOADING = 'Loading GitLab Web IDE...';

function initializeFileSystemProvider(
  disposables: vscode.Disposable[],
  fs: FileSystem,
  isReadonly: boolean,
) {
  const vscodeFs = new GitLabFileSystemProvider(fs);

  disposables.push(
    vscode.workspace.registerFileSystemProvider(FS_SCHEME, vscodeFs, {
      isCaseSensitive: true,
      isReadonly,
    }),
  );
}

function refreshFileView() {
  // why: We need to refresh file view by closing and opening the sidebar.
  //      Otherwise, the file view shows the root folder.
  //      https://gitlab.com/khulnasoft/web-ide/-/merge_requests/81#note_1178771600
  return Promise.allSettled([
    vscode.commands.executeCommand('workbench.action.closeSidebar'),
    vscode.commands.executeCommand('workbench.explorer.fileView.focus'),
  ]);
}

/**
 * This is the main function that bootstraps the Web IDE VSCode environment
 */
async function initialize(
  context: vscode.ExtensionContext,
  apiClient: DefaultGitLabClient,
  disposables: vscode.Disposable[],
  progress: vscode.Progress<{ increment: number; message: string }>,
  options: InitializeOptions,
) {
  if (options.pageReload) {
    updateWebIdeContext({
      ref: options.ref,
      projectPath: options.projectPath,
    });
  }

  progress.report({ increment: -1, message: options.isReload ? MSG_LOADING : MSG_INITIALIZING });

  const startResponse = start({ ref: options.ref });
  const localStorage = new DefaultLocalStorage(context.globalState);

  const { files, ref, repoRoot, project, mergeRequest, userPermissions, forkInfo } =
    await startResponse;

  // If user can't push, show warning message
  if (!userPermissions.pushCode) {
    // We don't need to wait for this warning. Just fire and forget.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    showCannotPushCodeWarning(forkInfo);
  }

  // If we are on the merge request branch, consider the merge request URL assoc with the branch
  const branchMergeRequestUrl = mergeRequest?.isMergeRequestBranch
    ? mergeRequest.mergeRequestUrl
    : '';

  const { fs, sourceControl, sourceControlFs } = await createSystems({
    contentProvider: new GitLabFileContentProvider(ref.sha),
    gitLsTree: files,
    repoRoot,
  });
  const fileList = new DefaultFileList({
    initBlobs: files.map(x => x.path),
    sourceControl,
  }).withCache(fs);

  await initializeFileSystemProvider(disposables, fs, !userPermissions.pushCode);
  disposables.push(
    vscode.workspace.registerFileSearchProvider(
      FS_SCHEME,
      new GitLabFileSearchProvider(new DefaultFileSearcher(fileList), repoRoot),
    ),
  );

  registerCommands(disposables, startResponse, sourceControl, apiClient);

  const config = await getConfig();
  await initializeSourceControl(disposables, {
    apiClient,
    sourceControl,
    sourceControlFs,
    localStorage,
    repoRoot,
    ref,
    project,
    branchMergeRequestUrl,
    config,
  });

  initBranchStatusBarItem(disposables, ref);

  await refreshFileView();

  if (!config.crossOriginExtensionHost) {
    // This is purely to make sure that the user is aware of the security reasons.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    showSecurityWarning(localStorage);
  }

  // what: Declare to the parent context that the Web IDE is "ready"
  await vscode.commands.executeCommand('setContext', WEB_IDE_READY_CONTEXT_ID, true);

  // what: We can load this extra context after we are "ready"
  if (mergeRequest?.isMergeRequestBranch) {
    await initMergeRequestContext(disposables, progress, {
      mergeRequest,
      files,
      repoRoot,
      isReload: options.isReload,
    });
  }
}

/**
 * This wraps the main initialize function with a nice VSCode progress bar
 */
async function initializeWithProgress(
  context: vscode.ExtensionContext,
  apiClient: DefaultGitLabClient,
  disposables: vscode.Disposable[],
) {
  await Promise.allSettled([
    vscode.window.withProgress(
      {
        cancellable: false,
        location: vscode.ProgressLocation.Notification,
      },
      progress =>
        initialize(context, apiClient, disposables, progress, {
          isReload: false,
          pageReload: false,
        }),
    ),
    openWalkthrough(),
  ]);

  await openInitFile();
}

const setupDisposables = (context: vscode.ExtensionContext) => {
  // Lovingly borrowed from https://sourcegraph.com/github.com/microsoft/vscode@3bdea7784d6ef67722967a4cd51179b30e9a1013/-/blob/extensions/git/src/main.ts?L175
  const disposables: vscode.Disposable[] = [];

  // FIXME: This is a separate set of disposables that are recycled with the "reload" command.
  //        This can be improved upon with reactive state management.
  const reloadDisposables: vscode.Disposable[] = [];

  context.subscriptions.push(
    new vscode.Disposable(() => vscode.Disposable.from(...disposables).dispose()),
    new vscode.Disposable(() => vscode.Disposable.from(...reloadDisposables).dispose()),
  );

  return {
    disposables,
    reloadDisposables,
  };
};

export async function activate(context: vscode.ExtensionContext): Promise<WebIDEExtension> {
  initExtensionContext(context);

  // Setup disposables
  const { disposables, reloadDisposables } = setupDisposables(context);

  // Setup log writer Singleton
  const outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  setDefaultLogWriter(new OutputChannelLogWriter(outputChannel));
  disposables.push(outputChannel);

  // Setup mediator command executor Singleton
  const apiAuthProvider = new WebIdeExtensionTokenProvider(context);
  await setupMediatorCommandExecutor(apiAuthProvider);

  const config = await getConfig();

  const apiClient = createGitLabClient(config, apiAuthProvider);

  await vscode.commands.executeCommand(
    'setContext',
    'additionalSourceControlOperations',
    config.featureFlags?.additionalSourceControlOperations,
  );

  disposables.push(
    // Setup auth provider
    await registerAuthenticationProvider(context, apiAuthProvider, config),
    // Setup global commands
    registerReloadCommand(context, apiClient, reloadDisposables, initialize),
    registerShowLogsCommand(outputChannel),
    await setupExtensionMarketplaceDisabledView(config),
  );

  // Actually start the Web IDE file system and source control things
  // not awaiting to prevent blocking khulnasoft-vscode-extension activation
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  initializeWithProgress(context, apiClient, reloadDisposables);

  setupThirdPartyExtensions(context);

  return {
    gitlabUrl: config.gitlabUrl,
    projectPath: config.projectPath,
    currentRef: config.ref,
    isTelemetryEnabled() {
      return config.telemetryEnabled || false;
    },
  };
}

export function deactivate() { }
