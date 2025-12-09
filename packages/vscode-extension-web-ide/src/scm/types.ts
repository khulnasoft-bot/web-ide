import type * as vscode from 'vscode';
import type { FileStatus } from '@khulnasoft/web-ide-fs';

export interface StatusViewModel {
  readonly uri: vscode.Uri;
  readonly command: vscode.Command;
  readonly decorations: {
    readonly tooltip: string;
    readonly letter: string;
    readonly color: vscode.ThemeColor;
    readonly strikethrough: boolean;
    readonly propagate: boolean;
  };
}

export interface ReadonlySourceControlViewModel {
  getCommitMessage(): string;
  getStatus(): FileStatus[];
}

export interface SourceControlViewModel extends ReadonlySourceControlViewModel {
  update(statuses: FileStatus[]): void;
}

export interface CommitCommandOptions {
  readonly shouldPromptBranchName: boolean;
}

// Note: The commit command is unexpectedly called with `null` sometimes
// probably due to some internal VSCode behavior. Please see this issue:
// https://gitlab.com/gitlab-org/gitlab/-/issues/438833
export type CommitCommand = (options?: CommitCommandOptions | null) => Promise<void>;
