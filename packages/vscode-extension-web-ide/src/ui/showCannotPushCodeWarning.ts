import * as vscode from 'vscode';
import type { ForkInfo } from '@gitlab/web-ide-types';
import { setHref } from '../mediator';

// why: Export msg for testing
export const MSG_CANNOT_PUSH_CODE_SHOULD_FORK =
  "You can't edit files directly in this project. To make changes, fork the project and create a merge request.";
export const MSG_CANNOT_PUSH_CODE_GO_TO_FORK =
  "You can't edit files directly in this project. To make changes, go to your fork and create a merge request.";
export const MSG_CANNOT_PUSH_CODE =
  'You must have permission to edit files directly in this project.';

export const MSG_FORK = 'Fork project';

export const MSG_GO_TO_FORK = 'Go to fork';

export const MSG_TITLE = "You don't have write access";

const getParts = (forkInfo?: ForkInfo) => {
  if (forkInfo?.ide_path) {
    return {
      message: MSG_CANNOT_PUSH_CODE_GO_TO_FORK,
      action: {
        text: MSG_GO_TO_FORK,
        href: forkInfo.ide_path,
      },
    };
  }

  if (forkInfo?.fork_path) {
    return {
      message: MSG_CANNOT_PUSH_CODE_SHOULD_FORK,
      action: {
        text: MSG_FORK,
        href: forkInfo.fork_path,
      },
    };
  }

  return {
    message: MSG_CANNOT_PUSH_CODE,
  };
};

export const showCannotPushCodeWarning = async (forkInfo?: ForkInfo): Promise<void> => {
  const { message, action } = getParts(forkInfo);

  const actions = action ? [action.text] : [];

  const selection = await vscode.window.showWarningMessage(
    MSG_TITLE,
    { modal: true, detail: message },
    ...actions,
  );

  if (action && selection === action.text) {
    await setHref(action.href);
  }
};
