import type { GitLabProjectPushRules } from '@khulnasoft/vscode-mediator-commands';

export const positiveRegexErrorMessage = (pushRule: string) =>
  `⚠️ Commit message violates the project's push rules.
  Commit must match the following pattern: "${pushRule}"`;
export const negativeRegexErrorMessage = (pushRule: string) =>
  `⚠️ Commit message violates the project's push rules.
Commit must not match the following pattern: "${pushRule}"`;

export const asRegExp = (str: string) => {
  if (!str) {
    return null;
  }

  try {
    return new RegExp(str);
  } catch {
    return null;
  }
};

export function lintCommit({
  value,
  pushRules,
}: {
  value: string;
  pushRules: GitLabProjectPushRules;
}) {
  if (!value || !pushRules) {
    return '';
  }

  const positiveRegExp = asRegExp(pushRules.commit_message_regex);
  const negativeRegExp = asRegExp(pushRules.commit_message_negative_regex);

  if (positiveRegExp && !positiveRegExp.test(value)) {
    return positiveRegexErrorMessage(pushRules.commit_message_regex);
  }
  if (negativeRegExp && negativeRegExp.test(value)) {
    return negativeRegexErrorMessage(pushRules.commit_message_negative_regex);
  }

  return '';
}
