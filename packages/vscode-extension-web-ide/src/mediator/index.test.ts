import * as vscode from 'vscode';
import { COMMAND_MEDIATOR_TOKEN } from '@khulnasoft/web-ide-interop';
import {
  COMMAND_COMMIT,
  COMMAND_CREATE_PROJECT_BRANCH,
  COMMAND_FETCH_FILE_RAW,
  COMMAND_FETCH_MERGE_REQUEST_DIFF_STATS,
  COMMAND_FETCH_PROJECT_BRANCHES,
  COMMAND_START,
} from '@khulnasoft/vscode-mediator-commands';
import { NOOP_AUTH_PROVIDER } from '@gitlab/gitlab-api-client';
import * as mediator from './index';
import { setupMediatorCommandExecutor } from './executor';
import { setupFakeMediatorToken } from '../../test-utils/setupFakeMediatorToken';

const TEST_MEDIATOR_TOKEN = 'fake-mediator-token';

describe('vscode-extension-web-ide/mediator/index', () => {
  beforeEach(async () => {
    await setupMediatorCommandExecutor(NOOP_AUTH_PROVIDER);
    setupFakeMediatorToken(TEST_MEDIATOR_TOKEN);
  });

  it('memoizes mediator token', async () => {
    expect(vscode.commands.executeCommand).not.toHaveBeenCalled();

    await mediator.start();
    await mediator.start();
    await mediator.start();

    expect(jest.mocked(vscode.commands.executeCommand).mock.calls).toEqual([
      [COMMAND_MEDIATOR_TOKEN],
      [COMMAND_START, TEST_MEDIATOR_TOKEN, {}],
      [COMMAND_START, TEST_MEDIATOR_TOKEN, {}],
      [COMMAND_START, TEST_MEDIATOR_TOKEN, {}],
    ]);
  });

  it.each`
    name                            | expectedCommand                           | args
    ${'start'}                      | ${COMMAND_START}                          | ${[{ ref: 'test' }]}
    ${'fetchFileRaw'}               | ${COMMAND_FETCH_FILE_RAW}                 | ${['ref', 'path']}
    ${'fetchMergeRequestDiffStats'} | ${COMMAND_FETCH_MERGE_REQUEST_DIFF_STATS} | ${[{}]}
    ${'fetchProjectBranches'}       | ${COMMAND_FETCH_PROJECT_BRANCHES}         | ${[{}]}
    ${'createProjectBranch'}        | ${COMMAND_CREATE_PROJECT_BRANCH}          | ${[{}]}
    ${'commit'}                     | ${COMMAND_COMMIT}                         | ${[{}]}
  `(
    '$name calls $expectedCommand',
    async ({
      name,
      expectedCommand,
      args,
    }: {
      name: keyof typeof mediator;
      expectedCommand: string;
      args: never[];
    }) => {
      expect(vscode.commands.executeCommand).not.toHaveBeenCalled();

      const mediatorFn: (...x: never[]) => unknown = mediator[name];
      await mediatorFn(...args);

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        expectedCommand,
        TEST_MEDIATOR_TOKEN,
        ...args,
      );
    },
  );
});
