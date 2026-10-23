import type { GitLabRef } from '@gitlab/vscode-mediator-commands';

const SHORT_SHA_LENGTH = 8;

export const getRefName = (ref: GitLabRef) => {
  if (ref.type === 'branch') {
    return ref.branch.name;
  }
  if (ref.type === 'tag') {
    return ref.name;
  }

  // Convert to short sha to get the name
  return ref.sha.slice(0, SHORT_SHA_LENGTH);
};
