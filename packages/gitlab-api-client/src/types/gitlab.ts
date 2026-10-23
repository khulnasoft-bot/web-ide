/* eslint-disable-next-line @typescript-eslint/no-namespace */
export namespace gitlab {
  export interface Commit {
    id: string;
    short_id: string;
    created_at: string;
    title: string;
    message: string;
    web_url: string;
  }
  export interface CommitDetails extends Commit {
    parent_ids: string[];
    authored_date: string;
    committed_date: string;
    stats: {
      additions: number;
      deletions: number;
      total: number;
    };
  }
  export interface CommitDiff {
    diff: string;
    new_path: string;
    old_path: string;
    a_mode: string;
    b_mode: string;
    new_file: boolean;
    renamed_file: boolean;
    deleted_file: boolean;
    a_blob_id?: string;
    b_blob_id?: string;
  }

  export interface Branch {
    name: string;
    commit: Commit;
    web_url: string;
    can_push: boolean;
    protected: boolean;
    default: boolean;
  }

  // https://docs.gitlab.com/ee/api/projects.html#get-single-project
  export interface Project {
    id: number;
    default_branch: string;
    web_url: string;
    name: string;
    can_create_merge_request_in: boolean;
    empty_repo: boolean;
    path_with_namespace: string;
  }

  // https://docs.gitlab.com/ee/api/projects.html#push-rules
  export interface ProjectPushRules {
    id: number;
    project_id: number;
    commit_message_regex: string;
    commit_message_negative_regex: string;
    branch_name_regex: string;
    deny_delete_tag: false;
    created_at: string;
    member_check: boolean;
    prevent_secrets: boolean;
    author_email_regex: string;
    file_name_regex: string;
    max_file_size: number;
    commit_committer_check: boolean;
    commit_committer_name_check: boolean;
    reject_unsigned_commits: boolean;
    reject_non_dco_commits: boolean;
  }

  // https://docs.gitlab.com/ee/api/merge_requests.html#response
  export interface MergeRequest {
    id: number;
    iid: number;
    source_branch: string;
    source_project_id: number;
    target_branch: string;
    target_project_id: number;
    web_url: string;
    diff_refs: { base_sha: string; head_sha: string; start_sha: string };
  }

  export interface File {
    id: string;
    last_commit_sha: string;
    path: string;
    name: string;
    extension: string;
    size: number;
    mime_type: string;
    binary: boolean;
    simple_viewer: string;
    rich_viewer: string;
    show_viewer_switcher: string;
    render_error?: string;
    raw_path: string;
    blame_path: string;
    commits_path: string;
    tree_path: string;
    permalink: string;
  }

  // https://docs.gitlab.com/ee/api/repositories.html#list-repository-tree
  export interface RepositoryTreeItem {
    id: string;
    name: string;
    type: 'tree' | 'blob';
    path: string;
    mode: string;
  }

  // https://docs.gitlab.com/ee/api/commits.html#create-a-commit-with-multiple-files-and-actions
  export interface CommitActionPayload {
    action: 'move' | 'create' | 'delete' | 'update';
    file_path: string;
    previous_path?: string;
    content?: string;
    encoding?: 'base64' | 'text';
    last_commit_id?: string;
  }

  export interface CommitPayload {
    branch: string;
    commit_message: string;
    actions: CommitActionPayload[];
    start_sha?: string;
    start_branch?: string;
    force?: boolean;
  }
}

export type { ProjectUserPermissions } from '../graphql/getProjectUserPermissions.query';
