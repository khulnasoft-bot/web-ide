import * as vscode from 'vscode';
import { parseResponseErrorMessage, log } from '../../utils';
import {
  CHECKOUT_BRANCH_COMMAND_ID,
  COMMIT_COMMAND_ID,
  SHOW_LOGS_COMMAND_ID,
} from '../../constants';
import { openUri } from '../../mediator';

export const DENIED_BY_CUSTOM_HOOKS_ERROR = /denied by custom hooks/;
export const BRANCH_ALREADY_EXISTS_ERROR = /branch.*already.*exists/;
export const FILE_HAS_CHANGED_ERROR = /file.*has.*changed.*/;
export const BRANCH_NAME_INVALID = /branch name.*invalid/i;
export const SECRET_DETECTED = /PUSH BLOCKED.*Secrets detected/i;

export const SESSION_EXPIRED_ERROR_MESSAGE =
  'Your user session has expired, and your changes could not be committed. Sign in again and commit your changes.';
export const FORBIDDEN_ERROR_MESSAGE = "You're not allowed to push to this branch.";
export const CUSTOM_PUSH_RULE_ERROR_MESSAGE =
  'This commit violates one or more push rules. Fix these violations and try again.';
export const GENERIC_ERROR_MESSAGE =
  'Failed to commit changes. See the console for more information.';
export const SECRET_DETECTED_GENERIC_MESSAGE =
  'Could not push the commit. The secret detection scan encountered one or more findings.';

export const SIGN_IN_ACTION = { title: 'Sign in' };
export const CLOSE_ACTION = { title: 'Close' };
export const SWITCH_BRANCH_ACTION = { title: 'Switch branch' };
export const COMMIT_TO_NEW_BRANCH_ACTION = { title: 'Create new branch and commit' };
export const ENTER_BRANCH_NAME_ACTION = { title: 'Enter branch name' };
export const SHOW_LOGS_ACTION = { title: 'See results' };

function hasMessage(arg: unknown): arg is { message: string } {
  if (!arg || typeof arg !== 'object') {
    return false;
  }

  const body = arg as { message: string };

  return typeof body.message === 'string';
}

function buildCommitErrorMessage(error: unknown): [string, vscode.MessageItem] {
  const responseError = parseResponseErrorMessage(error as Error);

  if (typeof responseError === 'string') {
    return [GENERIC_ERROR_MESSAGE, CLOSE_ACTION];
  }

  const { status, body } = responseError;

  if (status === 400 && hasMessage(body)) {
    const message = body.message as string;

    if (DENIED_BY_CUSTOM_HOOKS_ERROR.test(message)) {
      return [CUSTOM_PUSH_RULE_ERROR_MESSAGE, CLOSE_ACTION];
    }

    if (BRANCH_ALREADY_EXISTS_ERROR.test(message)) {
      return [message, SWITCH_BRANCH_ACTION];
    }

    if (FILE_HAS_CHANGED_ERROR.test(message)) {
      return [message, CLOSE_ACTION];
    }

    if (BRANCH_NAME_INVALID.test(message)) {
      return [message, ENTER_BRANCH_NAME_ACTION];
    }

    if (SECRET_DETECTED.test(message)) {
      // log message to the output channel
      log.error(message);
      return [SECRET_DETECTED_GENERIC_MESSAGE, SHOW_LOGS_ACTION];
    }

    return [message, CLOSE_ACTION];
  }

  if (status === 401) {
    return [SESSION_EXPIRED_ERROR_MESSAGE, SIGN_IN_ACTION];
  }

  if (status === 403) {
    return [FORBIDDEN_ERROR_MESSAGE, COMMIT_TO_NEW_BRANCH_ACTION];
  }

  return [GENERIC_ERROR_MESSAGE, CLOSE_ACTION];
}

export async function showCommitErrorMessage(error: unknown): Promise<void> {
  const action = await vscode.window.showErrorMessage(...buildCommitErrorMessage(error));

  if (action === undefined) {
    return;
  }

  if (action === SIGN_IN_ACTION) {
    await openUri({ key: 'signIn' });
  } else if (action === SWITCH_BRANCH_ACTION) {
    await vscode.commands.executeCommand(CHECKOUT_BRANCH_COMMAND_ID);
  } else if (action === SHOW_LOGS_ACTION) {
    await vscode.commands.executeCommand(SHOW_LOGS_COMMAND_ID);
  } else if ([COMMIT_TO_NEW_BRANCH_ACTION, ENTER_BRANCH_NAME_ACTION].includes(action)) {
    await vscode.commands.executeCommand(COMMIT_COMMAND_ID, { shouldPromptBranchName: true });
  }
}
