import type { FileStatus } from '@khulnasoft/web-ide-fs';
import { FileStatusType } from '@khulnasoft/web-ide-fs';
import type { GitLabCommitPayload } from '@khulnasoft/vscode-mediator-commands';
import { cleanLeadingSeparator } from '@khulnasoft/utils-path';

interface GetCommitPayloadOptions {
  status: FileStatus[];
  commitMessage: string;
  branchName: string;
  isNewBranch: boolean;
  startingSha: string;
  force?: boolean;
}

const getCommitActionType = (status: FileStatus): 'create' | 'delete' | 'update' => {
  switch (status.type) {
    case FileStatusType.Created:
      return 'create';
    case FileStatusType.Deleted:
      return 'delete';
    case FileStatusType.Modified:
      return 'update';
    // why: This should never happen, but eslint requies a "default:"
    default:
      throw new Error(`Unexpected status type: ${status}`);
  }
};

const getCommitActionContent = (
  status: FileStatus,
): Record<string, never> | { content: string; encoding: 'base64' } => {
  if (status.type === FileStatusType.Deleted) {
    return {};
  }

  return {
    content: status.content.toString('base64'),
    encoding: 'base64',
  };
};

export const getCommitPayload = ({
  commitMessage,
  branchName,
  status,
  isNewBranch,
  startingSha,
  force = false,
}: GetCommitPayloadOptions): GitLabCommitPayload => {
  let payload: GitLabCommitPayload = {
    commit_message: commitMessage,
    branch: branchName,
    actions: status.map(x => ({
      action: getCommitActionType(x),
      file_path: cleanLeadingSeparator(x.path),
      // why: Some of these conditions are copied from the origina Web IDE impl.
      //      https://gitlab.com/gitlab-org/gitlab/-/blob/dd1e70d3676891025534dc4a1e89ca9383178fe7/app/assets/javascripts/ide/stores/utils.js#L122
      last_commit_id:
        force || isNewBranch || x.type === FileStatusType.Deleted ? undefined : startingSha,
      ...getCommitActionContent(x),
    })),
  };

  if (isNewBranch) {
    payload = { ...payload, start_sha: startingSha };
  }

  if (force) {
    payload = { ...payload, start_sha: startingSha, force: true };
  }

  return payload;
};
