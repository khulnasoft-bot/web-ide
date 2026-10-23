import type { DefaultGitLabClient, gitlab } from '@gitlab/gitlab-api-client';
import type { GitLabCommitPayload } from '@gitlab/vscode-mediator-commands';
import { gitlabApi } from '@gitlab/gitlab-api-client';
import type { FileStatus } from '@gitlab/web-ide-fs';
import { FileStatusType } from '@gitlab/web-ide-fs';
import { getCommitPayload } from './getCommitPayload';

export interface GetAmendCommitPayloadOptions {
  projectId: string;
  status: FileStatus[];
  commitMessage: string;
  startingSha: string;
  isNewBranch: boolean;
  branchName: string;
}

const mergeOriginalAndCurrentChanges = async (
  originalDiff: gitlab.CommitDiff[],
  projectId: string,
  sha: string,
  status: FileStatus[],
  apiClient: DefaultGitLabClient,
): Promise<Map<string, FileStatus>> => {
  const originalFiles = (
    await Promise.all(
      originalDiff.map(async diff => {
        let fileType = FileStatusType.Modified;
        if (diff.new_file) {
          fileType = FileStatusType.Created;
        } else if (diff.deleted_file) {
          fileType = FileStatusType.Deleted;
        }

        if (fileType === FileStatusType.Deleted) {
          return { path: diff.old_path, type: FileStatusType.Deleted } as FileStatus;
        }

        const rawContent = await apiClient.fetchBufferFromApi(
          gitlabApi.getRawFile.createRequest({
            projectId: String(projectId),
            ref: sha,
            path: diff.new_path,
          }),
        );

        return {
          path: diff.new_path,
          content: Buffer.from(rawContent),
          type: fileType,
        } as FileStatus;
      }),
    )
  ).filter(file => file !== null);

  const fileMap = new Map(originalFiles.map(file => [file.path, file as FileStatus]));

  status.forEach(currentFile => {
    const committedFile = fileMap.get(currentFile.path);

    if (
      committedFile?.type === FileStatusType.Created &&
      currentFile.type === FileStatusType.Deleted
    ) {
      fileMap.delete(currentFile.path);
    } else if (
      committedFile?.type === FileStatusType.Created &&
      currentFile.type === FileStatusType.Modified
    ) {
      fileMap.set(currentFile.path, { ...currentFile, type: FileStatusType.Created });
    } else {
      fileMap.set(currentFile.path, currentFile);
    }
  });

  return fileMap;
};

export const getAmendCommitPayload = async (
  apiClient: DefaultGitLabClient,
  {
    status,
    projectId,
    commitMessage,
    branchName,
    isNewBranch,
    startingSha,
  }: GetAmendCommitPayloadOptions,
): Promise<GitLabCommitPayload> => {
  try {
    const originalCommit: gitlab.CommitDetails = await apiClient.fetchFromApi(
      gitlabApi.getCommit.createRequest({ projectId, sha: startingSha }),
    );

    const parentSha = originalCommit.parent_ids[0] || startingSha;
    const originalCommitMessage = originalCommit.message;

    const originalDiff: gitlab.CommitDiff[] = await apiClient.fetchFromApi(
      gitlabApi.getCommitDiff.createRequest({ projectId, sha: startingSha }),
    );

    const fileMap = await mergeOriginalAndCurrentChanges(
      originalDiff,
      projectId,
      startingSha,
      status,
      apiClient,
    );
    const commitStatus = Array.from(fileMap.values());

    return getCommitPayload({
      status: commitStatus,
      commitMessage: commitMessage || originalCommitMessage,
      branchName,
      isNewBranch,
      startingSha: parentSha,
      force: true,
    });
  } catch {
    throw new Error(
      JSON.stringify({
        status: 400,
        body: {
          message:
            'Unable to get commit information. Try again or check the console logs for details.',
        },
      }),
    );
  }
};
