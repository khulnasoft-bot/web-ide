import * as vscode from 'vscode';

interface ShowConfirmForcePushOptions {
  force: boolean;
  amend: boolean;
  existingCommits?: number;
}

const generateAmendMessage = () => ({
  title: 'This action will permanently overwrite the latest commit. Are you sure?',
  detail: 'The deleted commit may not belong to you, and can never be recovered.',
});

const generateAmendWithMultipleCommitsMessage = (existingCommits = 0) => ({
  title: `This action will permanently delete ${existingCommits} commits and overwrite the latest commit. Are you sure?`,
  detail: 'The deleted commits may not belong to you, and can never be recovered.',
});

const generateForcePushMessage = (existingCommits = 0) => ({
  title: `This action will permanently delete ${existingCommits} commits in the remote branch. Are you sure?`,
  detail: 'The deleted commits may not belong to you, and can never be recovered.',
});

export const showConfirmForcePush = async ({
  force = false,
  amend = false,
  existingCommits = 0,
}: ShowConfirmForcePushOptions): Promise<boolean> => {
  if (!force && !amend) {
    return true;
  }

  let message;

  if (force && existingCommits) {
    message = generateForcePushMessage(existingCommits);
  }

  if (amend) {
    message = existingCommits
      ? generateAmendWithMultipleCommitsMessage(existingCommits)
      : generateAmendMessage();
  }

  if (message) {
    const answer = await vscode.window.showWarningMessage(
      message.title,
      { modal: true, detail: message.detail },
      'Permanently Overwrite',
    );

    return answer === 'Permanently Overwrite';
  }

  return true;
};
