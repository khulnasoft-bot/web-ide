import * as vscode from 'vscode';
import {
  showCommitErrorMessage,
  CLOSE_ACTION,
  SWITCH_BRANCH_ACTION,
  SIGN_IN_ACTION,
  ENTER_BRANCH_NAME_ACTION,
  COMMIT_TO_NEW_BRANCH_ACTION,
  SHOW_LOGS_ACTION,
  CUSTOM_PUSH_RULE_ERROR_MESSAGE,
  SESSION_EXPIRED_ERROR_MESSAGE,
  FORBIDDEN_ERROR_MESSAGE,
  GENERIC_ERROR_MESSAGE,
  SECRET_DETECTED_GENERIC_MESSAGE,
} from './showCommitErrorMessage';
import { openUri } from '../../mediator';
import {
  CHECKOUT_BRANCH_COMMAND_ID,
  COMMIT_COMMAND_ID,
  SHOW_LOGS_COMMAND_ID,
} from '../../constants';
import { setupFakeMediatorToken } from '../../../test-utils/setupFakeMediatorToken';

jest.mock('../../mediator');

const TEST_BRANCH_NAME_ERROR =
  "Something went wrong when we tried to create 'not a good branch name' for you: Branch name is invalid";
const TEST_RANDOM_ERROR = 'Lorem ipsum dolar sit';

const FAKE_MEDIATOR_TOKEN = 'fake-mediator-token';

describe('scm/commit/showCommitErrorMessage', () => {
  beforeEach(() => {
    setupFakeMediatorToken(FAKE_MEDIATOR_TOKEN);
  });

  describe('when handling a commit error', () => {
    it.each`
      error                                                                   | description                                  | message                            | action
      ${{ status: 400, body: { message: 'denied by custom hooks' } }}         | ${'handling a push rule error'}              | ${CUSTOM_PUSH_RULE_ERROR_MESSAGE}  | ${CLOSE_ACTION}
      ${{ status: 400, body: { message: 'branch already exists' } }}          | ${'handling a branch already exists error'}  | ${'branch already exists'}         | ${SWITCH_BRANCH_ACTION}
      ${{ status: 400, body: { message: 'file has changed' } }}               | ${'handling a file has changed error'}       | ${'file has changed'}              | ${CLOSE_ACTION}
      ${{ status: 400, body: { message: 'PUSH BLOCKED: Secrets detected' } }} | ${'handling a secret push protection error'} | ${SECRET_DETECTED_GENERIC_MESSAGE} | ${SHOW_LOGS_ACTION}
      ${{ status: 400, body: { message: TEST_BRANCH_NAME_ERROR } }}           | ${'handling a branch name error'}            | ${TEST_BRANCH_NAME_ERROR}          | ${ENTER_BRANCH_NAME_ACTION}
      ${{ status: 400, body: { message: TEST_RANDOM_ERROR } }}                | ${'handling a random but well formed error'} | ${TEST_RANDOM_ERROR}               | ${CLOSE_ACTION}
      ${{ status: 400, body: null }}                                          | ${'handling an unknown bad request error'}   | ${GENERIC_ERROR_MESSAGE}           | ${CLOSE_ACTION}
      ${{ status: 401, body: null }}                                          | ${'handling a session expired error'}        | ${SESSION_EXPIRED_ERROR_MESSAGE}   | ${SIGN_IN_ACTION}
      ${{ status: 403, body: null }}                                          | ${'handling a cannot push to branch error'}  | ${FORBIDDEN_ERROR_MESSAGE}         | ${COMMIT_TO_NEW_BRANCH_ACTION}
      ${{ status: 500, body: null }}                                          | ${'handling a server error'}                 | ${GENERIC_ERROR_MESSAGE}           | ${CLOSE_ACTION}
      ${'unknown error'}                                                      | ${'handling an unknown error'}               | ${GENERIC_ERROR_MESSAGE}           | ${CLOSE_ACTION}
    `(
      '$description shows "$message" message with $action action',
      async ({ error, message, action }) => {
        await showCommitErrorMessage(new Error(JSON.stringify(error)));

        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(message, action);
      },
    );
  });

  describe('when the user selects an action', () => {
    it.each`
      action                         | description                                | command                       | params
      ${SWITCH_BRANCH_ACTION}        | ${'selecting switch branch action'}        | ${CHECKOUT_BRANCH_COMMAND_ID} | ${[]}
      ${COMMIT_TO_NEW_BRANCH_ACTION} | ${'selecting commit to new branch action'} | ${COMMIT_COMMAND_ID}          | ${[{ shouldPromptBranchName: true }]}
      ${ENTER_BRANCH_NAME_ACTION}    | ${'selecting enter branch name action'}    | ${COMMIT_COMMAND_ID}          | ${[{ shouldPromptBranchName: true }]}
      ${SHOW_LOGS_ACTION}            | ${'selecting see results action'}          | ${SHOW_LOGS_COMMAND_ID}       | ${[]}
    `('$description executes $command command', async ({ action, command, params }) => {
      const args = [command, ...params];

      jest.mocked(vscode.window.showErrorMessage).mockResolvedValue(action);

      await showCommitErrorMessage(new Error(JSON.stringify({ status: 401 })));

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(...args);
    });

    it('opens signIn url when user selects sign in', async () => {
      jest.mocked(vscode.window.showErrorMessage).mockResolvedValue(SIGN_IN_ACTION);

      await showCommitErrorMessage(new Error(JSON.stringify({ status: 401 })));

      expect(openUri).toHaveBeenCalledWith({ key: 'signIn' });
    });
  });
});
