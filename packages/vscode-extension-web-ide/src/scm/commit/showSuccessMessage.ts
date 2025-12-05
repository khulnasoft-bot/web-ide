import * as vscode from 'vscode';
import { joinPaths } from '@gitlab/utils-path';
import type { GitLabProject, GitLabRef } from '@gitlab/vscode-mediator-commands';
import { getConfig } from '../../mediator';

export interface ShowSuccessMessageOptions {
  // Current project for the Web IDE context.
  project: GitLabProject;

  // Current ref that the commit was made on top of.
  ref: GitLabRef;

  // Branch name for the new commit.
  commitBranchName: string;

  // URL for the existing MR associated with the `commitBranchName`.
  mrUrl?: string;

  force?: boolean;

  amend?: boolean;
}

// why: Export these for tests
export const ITEM_CREATE_MR = { title: 'Create MR' };
export const ITEM_GO_TO_MR = { title: 'Go to MR' };
export const ITEM_GO_TO_PROJECT = { title: 'Go to Project' };
export const ITEM_CONTINUE = { title: 'Continue working' };

export async function constructProjectUrl(pathWithNamespace: string): Promise<string> {
  const config = await getConfig();
  return joinPaths(config.gitlabUrl, '/', pathWithNamespace);
}

const getTargetBranchForMRUrl = ({ project, ref, commitBranchName }: ShowSuccessMessageOptions) => {
  if (ref.type !== 'branch') {
    return project.default_branch;
  }

  // If the new commit hasn't changed branches, just use the default branch as the target branch.
  // Else, if we're changing branches, use the current branch as the target branch.
  return ref.branch.name === commitBranchName ? project.default_branch : ref.branch.name;
};

const getNewMRUrl = async (options: ShowSuccessMessageOptions) => {
  const { project, commitBranchName } = options;

  const sourceBranch = commitBranchName;
  const targetBranch = getTargetBranchForMRUrl(options);
  const targetProjectId = targetBranch !== project.default_branch ? String(project.id) : '';

  const url = joinPaths(
    await constructProjectUrl(project.path_with_namespace),
    '-',
    'merge_requests',
    'new',
  );

  // It looks like `nav_source`, `source_branch,` and `target_branch` are the only params we need to worry about
  // https://gitlab.com/gitlab-org/gitlab/-/blob/dd1e70d3676891025534dc4a1e89ca9383178fe7/app/assets/javascripts/ide/stores/utils.js#L128
  const newMrParams = [
    'nav_source=webide',
    `merge_request[source_branch]=${encodeURIComponent(sourceBranch)}`,
    `merge_request[target_branch]=${encodeURIComponent(targetBranch)}`,
    targetProjectId && `merge_request[target_project_id]=${encodeURIComponent(targetProjectId)}`,
  ]
    .filter(Boolean)
    .join('&');

  return `${url}?${newMrParams}`;
};

const shouldShowCreateMRItem = (project: GitLabProject, branchName: string) =>
  project.can_create_merge_request_in &&
  project.default_branch !== branchName &&
  !project.empty_repo;

const getMRActionItem = (project: GitLabProject, branchName: string, mrUrl?: string) => {
  if (mrUrl) {
    return [ITEM_GO_TO_MR];
  }

  if (shouldShowCreateMRItem(project, branchName)) {
    return [ITEM_CREATE_MR];
  }

  return [];
};
const getSuccessMessage = ({ amend, force }: { amend: boolean; force: boolean }): string => {
  let message = '';
  if (!force && !amend) {
    message = `Your changes have been committed successfully.`;
  } else if (amend) {
    message = `Your changes have been amended and force pushed successfully.`;
  } else if (force) {
    message = `Your changes have been committed and force pushed successfully.`;
  }
  return message;
};

export const showSuccessMessage = async ({
  project,
  ref,
  commitBranchName,
  mrUrl,
  force = false,
  amend = false,
}: ShowSuccessMessageOptions) => {
  const items = [
    ...getMRActionItem(project, commitBranchName, mrUrl),
    ITEM_GO_TO_PROJECT,
    ITEM_CONTINUE,
  ];
  const selection = await vscode.window.showInformationMessage(
    getSuccessMessage({ amend, force }),
    ...items,
  );

  if (selection === ITEM_GO_TO_PROJECT) {
    await vscode.env.openExternal(
      vscode.Uri.parse(await constructProjectUrl(project.path_with_namespace)),
    );
  } else if (selection === ITEM_CREATE_MR) {
    await vscode.env.openExternal(
      vscode.Uri.parse(await getNewMRUrl({ project, ref, commitBranchName })),
    );
  } else if (selection === ITEM_GO_TO_MR && mrUrl) {
    await vscode.env.openExternal(vscode.Uri.parse(mrUrl));
  }
};
