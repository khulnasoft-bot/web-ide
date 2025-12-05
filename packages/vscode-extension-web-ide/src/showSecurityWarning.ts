import * as vscode from 'vscode';

const ACTION_DONT_SHOW_AGAIN = "Don't show again";

export async function showSecurityWarning(localStorage: vscode.Memento) {
  const DISMISS_KEY = 'securityWarningDismissed';

  if (localStorage.get(DISMISS_KEY, false)) {
    return;
  }

  const action = await vscode.window.showWarningMessage(
    'Web views and the Extension Marketplace were disabled for security reasons. The Web IDE requires HTTPs and an external extension host to isolate 3rd-party code.',
    ACTION_DONT_SHOW_AGAIN,
  );

  if (action === ACTION_DONT_SHOW_AGAIN) {
    await localStorage.update(DISMISS_KEY, true);
  }
}
