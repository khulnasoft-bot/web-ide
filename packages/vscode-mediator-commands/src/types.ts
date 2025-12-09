import type { gitlab, ProjectUserPermissions } from '@gitlab/gitlab-api-client';
import type { ForkInfo } from '@khulnasoft/web-ide-types';

// region: GitLab API Types we pass through to the extension -----------

export type GitLabCommitPayload = gitlab.CommitPayload;
export type GitLabRepositoryTreeItem = gitlab.RepositoryTreeItem;
export type GitLabBranch = gitlab.Branch;
export interface GitLabProjectPushRules {
  commit_message_regex: string;
  commit_message_negative_regex: string;
}
export interface GitLabProject extends gitlab.Project {
  push_rules?: GitLabProjectPushRules;
}

// region: Mediator specific types -------------------------------------

interface GitLabRefBranch {
  type: 'branch';
  branch: GitLabBranch;
  sha: string;
}

interface GitLabRefCommit {
  type: 'commit';
  sha: string;
}

interface GitLabRefTag {
  type: 'tag';
  name: string;
  sha: string;
}

// note: In this context "ref" refers to GitLab's definition of "ref"
//       (not necessarily git) which is a reference to a GitLab branch,
//       commit, or tag.
export type GitLabRef = GitLabRefBranch | GitLabRefCommit | GitLabRefTag;

interface MergeRequestContext {
  // id - Global ID (not iid) of the MergeRequest
  id: string;

  // isMergeRequestBranch - true if the branch has a corresponding MR URL
  isMergeRequestBranch: boolean;

  // mergeRequestUrl - the existing MR URL of the branch
  mergeRequestUrl: string;

  // baseSha - the base SHA of the MergeRequest (used for viewing MR changes)
  baseSha: string;
}

export interface StartCommandOptions {
  ref?: string;
}

export interface StartCommandResponse {
  // gitlUrl - GitLab instance URL
  gitlabUrl: string;

  // files - A list of files used to initialize the file system
  files: GitLabRepositoryTreeItem[];

  // ref - The ref (e.g. branch, commit, or tag) for the current Web IDE context
  ref: GitLabRef;

  // project - The GitLab Project for the current Web IDE context
  project: GitLabProject;

  // repoRoot - the root path of the FileSystem where the main repository lives
  repoRoot: string;

  // userPermissions - current user permissions for the project
  userPermissions: ProjectUserPermissions;

  // mergeRequest - contains optional MergeRequest properties of the current Web IDE context
  mergeRequest?: MergeRequestContext;

  // forkInfo - fork info about the project from the Config
  forkInfo?: ForkInfo;
}

export interface Command {
  id: string;
  handler: (...args: never[]) => unknown;
}

export interface VSCodeBuffer {
  readonly buffer: Uint8Array;
}

export type VSBufferWrapper = (arg0: Uint8Array) => VSCodeBuffer;
