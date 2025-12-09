// TODO: For some reason `ts-jest` isn't finsing the `.d.ts` files
import '../../vscode.proposed.scmActionButton.d';
import '../../vscode.proposed.scmValidation.d';
import { createConfig, createFakePartial } from '@khulnasoft/utils-test';
import type {
  FileStatus,
  SourceControlFileSystem,
  SourceControlSystem,
} from '@khulnasoft/web-ide-fs';
import { FileStatusType } from '@khulnasoft/web-ide-fs';
import * as vscode from 'vscode';
import type { DebouncedFunc } from 'lodash';
import { debounce } from 'lodash';

import type { WebIdeConfig } from '@khulnasoft/web-ide-types';
import type { DefaultGitLabClient } from '@gitlab/gitlab-api-client';
import { TEST_PROJECT, TEST_REF_BRANCH } from '../../test-utils';
import { createFakeGlobalState } from '../../test-utils/vscode';
import { initializeSourceControl } from './index';
import { createSourceControlViewModel } from './create';
import * as commitCommand from './commit/command';
import { COMMIT_COMMAND_ID, FS_SCHEME, SCM_SCHEME } from '../constants';
import { SourceControlFileSystemProvider } from '../vscode/SourceControlFileSystemProvider';
import type { SourceControlViewModel } from './types';
import { preventUnload } from '../mediator';
import DefaultLocalStorage from '../DefaultLocalStorage';
import type { LocalStorage } from '../types';

jest.mock('lodash');
jest.mock('../mediator');
jest.mock('./create');
jest.mock('./commit/command');

const TEST_REPO_ROOT = '/test-repo-root';
const TEST_BRANCH_MR_URL = 'https://gitlab.example.com/mr/7';
const TEST_STATUS: FileStatus[] = [{ type: FileStatusType.Deleted, path: '/README.md' }];
export const TEST_CONFIG: WebIdeConfig = {
  ...createConfig(),
  featureFlags: {
    additionalSourceControlOperations: false,
  },
};

const createNoopDisposable = (): vscode.Disposable => ({
  dispose() {
    // noop
  },
});

describe('scm/index', () => {
  let onDidChange: vscode.EventEmitter<vscode.Uri>;
  let onDidCreate: vscode.EventEmitter<vscode.Uri>;
  let onDidDelete: vscode.EventEmitter<vscode.Uri>;
  let disposables: vscode.Disposable[];
  let sourceControl: SourceControlSystem;
  let sourceControlFs: SourceControlFileSystem;
  let sourceControlVm: SourceControlViewModel;
  let localStorage: LocalStorage;
  let resolveDebounce: () => void;
  let apiClient: DefaultGitLabClient;

  beforeEach(async () => {
    onDidChange = new vscode.EventEmitter();
    onDidCreate = new vscode.EventEmitter();
    onDidDelete = new vscode.EventEmitter();
    disposables = [];

    sourceControl = {
      status: jest.fn().mockReturnValue(TEST_STATUS),
    };

    sourceControlFs = {
      readFile: jest.fn(),
      readFileOriginal: jest.fn(),
      stat: jest.fn(),
      statOriginal: jest.fn(),
    };

    sourceControlVm = {
      getCommitMessage: jest.fn(),
      getStatus: jest.fn(),
      update: jest.fn(),
    };

    localStorage = new DefaultLocalStorage(createFakeGlobalState());

    apiClient = createFakePartial<DefaultGitLabClient>({
      fetchFromApi: jest.fn(),
      fetchBufferFromApi: jest.fn(),
    });

    jest.mocked(debounce).mockImplementation(cb => {
      const fn = () => {
        resolveDebounce = () => cb();
      };

      return fn as DebouncedFunc<typeof cb>;
    });

    jest.mocked(createSourceControlViewModel).mockReturnValue(sourceControlVm);
    jest.mocked(commitCommand.factory).mockReturnValue(() => Promise.resolve());

    jest
      .mocked(vscode.workspace.registerFileSystemProvider)
      .mockImplementation(createNoopDisposable);
    jest.mocked(vscode.commands.registerCommand).mockImplementation(createNoopDisposable);

    jest.mocked(vscode.workspace.createFileSystemWatcher).mockReturnValue({
      onDidChange: onDidChange.event,
      onDidCreate: onDidCreate.event,
      onDidDelete: onDidDelete.event,
      ignoreCreateEvents: false,
      ignoreChangeEvents: false,
      ignoreDeleteEvents: false,
      dispose: jest.fn(),
    });

    await initializeSourceControl(disposables, {
      sourceControl,
      sourceControlFs,
      repoRoot: TEST_REPO_ROOT,
      ref: TEST_REF_BRANCH,
      branchMergeRequestUrl: TEST_BRANCH_MR_URL,
      project: TEST_PROJECT,
      localStorage,
      config: TEST_CONFIG,
      apiClient,
    });
  });

  it('registers file system provider', () => {
    expect(vscode.workspace.registerFileSystemProvider).toHaveBeenCalledWith(
      SCM_SCHEME,
      expect.any(SourceControlFileSystemProvider),
      { isReadonly: true },
    );
    const disposable = jest.mocked(vscode.workspace.registerFileSystemProvider).mock.results[0]
      .value;

    expect(disposables).toContain(disposable);
  });

  it('creates file watcher', () => {
    expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalledWith('**');
    const disposable = jest.mocked(vscode.workspace.createFileSystemWatcher).mock.results[0].value;

    expect(disposables).toContain(disposable);
  });

  it('creates source control view model', () => {
    expect(createSourceControlViewModel).toHaveBeenCalledWith(
      disposables,
      TEST_REPO_ROOT,
      TEST_REF_BRANCH,
      TEST_PROJECT,
      TEST_CONFIG,
    );
  });

  it('registers commit command', () => {
    expect(commitCommand.factory).toHaveBeenCalledWith({
      viewModel: sourceControlVm,
      ref: TEST_REF_BRANCH,
      branchMergeRequestUrl: TEST_BRANCH_MR_URL,
      project: TEST_PROJECT,
      localStorage,
      apiClient,
    });
  });

  it('registers commit and force push command', () => {
    expect(commitCommand.factory).toHaveBeenCalledWith({
      viewModel: sourceControlVm,
      ref: TEST_REF_BRANCH,
      branchMergeRequestUrl: TEST_BRANCH_MR_URL,
      project: TEST_PROJECT,
      localStorage,
      force: true,
      amend: false,
      apiClient,
    });
  });

  it('registers commit (amend) and force push command', () => {
    expect(commitCommand.factory).toHaveBeenCalledWith({
      viewModel: sourceControlVm,
      ref: TEST_REF_BRANCH,
      branchMergeRequestUrl: TEST_BRANCH_MR_URL,
      project: TEST_PROJECT,
      localStorage,
      force: true,
      amend: true,
      apiClient,
    });

    const commitCommandFn = jest.mocked(commitCommand).factory.mock.results[0].value;
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      COMMIT_COMMAND_ID,
      commitCommandFn,
    );

    const disposable = jest.mocked(vscode.commands.registerCommand).mock.results[0].value;
    expect(disposables).toContain(disposable);
  });

  describe.each`
    desc                 | act
    ${'on file changed'} | ${(uri: vscode.Uri) => onDidChange.fire(uri)}
    ${'on file added'}   | ${(uri: vscode.Uri) => onDidCreate.fire(uri)}
    ${'on file deleted'} | ${(uri: vscode.Uri) => onDidDelete.fire(uri)}
  `('$desc', ({ act }) => {
    it('updates view model with status', async () => {
      act(vscode.Uri.from({ scheme: FS_SCHEME, path: '/README.md' }));

      expect(sourceControl.status).not.toHaveBeenCalled();

      resolveDebounce();

      expect(sourceControl.status).toHaveBeenCalledTimes(1);

      await new Promise(process.nextTick);

      expect(sourceControlVm.update).toHaveBeenCalledWith(TEST_STATUS);
    });

    it('invokes preventUpload command', async () => {
      act(vscode.Uri.from({ scheme: FS_SCHEME, path: '/README.md' }));
      resolveDebounce();
      await new Promise(process.nextTick);

      expect(preventUnload).toHaveBeenCalledWith({ shouldPrevent: true });
    });
  });
});
