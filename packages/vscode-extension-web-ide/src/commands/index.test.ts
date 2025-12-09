import * as vscode from 'vscode';
import type { DefaultGitLabClient } from '@gitlab/gitlab-api-client';
import { createFakePartial } from '@khulnasoft/utils-test';
import {
  CHECKOUT_BRANCH_COMMAND_ID,
  GO_TO_GITLAB_COMMAND_ID,
  GO_TO_PROJECT_COMMAND_ID,
  SHARE_YOUR_FEEDBACK_COMMAND_ID,
  OPEN_REMOTE_WINDOW_COMMAND_ID,
  RELOAD_WITH_WARNING_COMMAND_ID,
  COMPARE_WITH_MR_BASE_COMMAND_ID,
  CREATE_BRANCH_COMMAND_ID,
  CREATE_BRANCH_FROM_BASE_COMMAND_ID,
  DELETE_BRANCH_COMMAND_ID,
} from '../constants';
import { registerCommands } from './index';
import checkoutBranch from './checkoutBranch';
import compareWithMrBase from './compareWithMrBase';
import goToKhulnaSoft from './goToGitLab';
import goToProject from './goToProject';
import reloadWithWarning from './reloadWithWarning';
import shareYourFeedback from './shareYourFeedback';
import { TEST_COMMANDS_INITIAL_DATA } from '../../test-utils';
import { createMockSourceControl } from '../../test-utils/createMockSourceControl';
import createBranch from './createBranch';
import deleteBranch from './deleteBranch';

jest.mock('./goToProject');
jest.mock('./goToGitLab');
jest.mock('./checkoutBranch');
jest.mock('./createBranch');
jest.mock('./deleteBranch');

describe('commands/index', () => {
  describe('registerCommands', () => {
    const sourceControl = createMockSourceControl();
    let disposables: vscode.Disposable[];
    let apiClient: DefaultGitLabClient;

    beforeEach(() => {
      disposables = [];
      apiClient = createFakePartial<DefaultGitLabClient>({
        fetchFromApi: jest.fn(),
      });
      jest
        .spyOn(vscode.commands, 'registerCommand')
        // Note: registerCommand has to return a Disposable, but we also add the commandName
        //       so that we can easily assert what kind of disposable was added to the array
        .mockImplementation(commandName => ({ commandName, dispose: () => 'noop' }));
    });

    it.each`
      commandName                        | commandFn
      ${SHARE_YOUR_FEEDBACK_COMMAND_ID}  | ${shareYourFeedback}
      ${RELOAD_WITH_WARNING_COMMAND_ID}  | ${reloadWithWarning}
      ${COMPARE_WITH_MR_BASE_COMMAND_ID} | ${compareWithMrBase}
    `(
      'registers $commandName command in the vscode command registry',
      ({ commandName, commandFn }) => {
        registerCommands(
          disposables,
          Promise.resolve(TEST_COMMANDS_INITIAL_DATA),
          sourceControl,
          apiClient,
        );

        expect(vscode.commands.registerCommand).toHaveBeenCalledWith(commandName, commandFn);
      },
    );

    it.each`
      commandName                 | commandFn
      ${GO_TO_GITLAB_COMMAND_ID}  | ${goToGitLab}
      ${GO_TO_PROJECT_COMMAND_ID} | ${goToProject}
    `(
      'provides command initial data and registers $commandName command in the vscode command registry',
      ({ commandName, commandFn }) => {
        const noop = () => true;
        jest.mocked(commandFn).mockReturnValueOnce(noop);

        registerCommands(
          disposables,
          Promise.resolve(TEST_COMMANDS_INITIAL_DATA),
          sourceControl,
          apiClient,
        );

        expect(commandFn).toHaveBeenCalledWith(Promise.resolve(TEST_COMMANDS_INITIAL_DATA));

        expect(vscode.commands.registerCommand).toHaveBeenCalledWith(commandName, noop);
      },
    );
    it(`provides command initial data and registers ${CHECKOUT_BRANCH_COMMAND_ID} command in the vscode command registry`, () => {
      const noop = () => Promise.resolve();
      jest.mocked(checkoutBranch).mockReturnValue(noop);

      registerCommands(
        disposables,
        Promise.resolve(TEST_COMMANDS_INITIAL_DATA),
        sourceControl,
        apiClient,
      );

      expect(checkoutBranch).toHaveBeenCalledWith(
        Promise.resolve(TEST_COMMANDS_INITIAL_DATA),
        sourceControl,
      );

      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        CHECKOUT_BRANCH_COMMAND_ID,
        noop,
      );
    });

    it.each`
      commandName                           | showBaseBranchSelection
      ${CREATE_BRANCH_COMMAND_ID}           | ${false}
      ${CREATE_BRANCH_FROM_BASE_COMMAND_ID} | ${true}
    `(
      'provides command initial data and registers $commandName command in the vscode command registry',
      ({ commandName, showBaseBranchSelection }) => {
        const noop = () => Promise.resolve();

        jest.mocked(createBranch).mockReturnValue(noop);

        registerCommands(
          disposables,
          Promise.resolve(TEST_COMMANDS_INITIAL_DATA),
          sourceControl,
          apiClient,
        );

        expect(createBranch).toHaveBeenCalledWith({
          asyncOptions: Promise.resolve(TEST_COMMANDS_INITIAL_DATA),
          sourceControl,
          showBaseBranchSelection,
        });

        expect(vscode.commands.registerCommand).toHaveBeenCalledWith(commandName, noop);
      },
    );

    it(`provides command initial data and registers ${DELETE_BRANCH_COMMAND_ID} command in the vscode command registry`, () => {
      const noop = () => Promise.resolve();
      jest.mocked(deleteBranch).mockReturnValue(noop);

      registerCommands(
        disposables,
        Promise.resolve(TEST_COMMANDS_INITIAL_DATA),
        sourceControl,
        apiClient,
      );

      expect(deleteBranch).toHaveBeenCalledWith({
        asyncOptions: Promise.resolve(TEST_COMMANDS_INITIAL_DATA),
        sourceControl,
        apiClient,
      });

      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(DELETE_BRANCH_COMMAND_ID, noop);
    });

    it('registers commands in disposables', () => {
      registerCommands(
        disposables,
        Promise.resolve(TEST_COMMANDS_INITIAL_DATA),
        sourceControl,
        apiClient,
      );

      expect(disposables).toEqual([
        { commandName: CHECKOUT_BRANCH_COMMAND_ID, dispose: expect.any(Function) },
        { commandName: CREATE_BRANCH_COMMAND_ID, dispose: expect.any(Function) },
        { commandName: CREATE_BRANCH_FROM_BASE_COMMAND_ID, dispose: expect.any(Function) },
        { commandName: DELETE_BRANCH_COMMAND_ID, dispose: expect.any(Function) },
        { commandName: COMPARE_WITH_MR_BASE_COMMAND_ID, dispose: expect.any(Function) },
        { commandName: GO_TO_GITLAB_COMMAND_ID, dispose: expect.any(Function) },
        { commandName: GO_TO_PROJECT_COMMAND_ID, dispose: expect.any(Function) },
        { commandName: OPEN_REMOTE_WINDOW_COMMAND_ID, dispose: expect.any(Function) },
        { commandName: SHARE_YOUR_FEEDBACK_COMMAND_ID, dispose: expect.any(Function) },
        { commandName: RELOAD_WITH_WARNING_COMMAND_ID, dispose: expect.any(Function) },
      ]);
    });
  });
});
