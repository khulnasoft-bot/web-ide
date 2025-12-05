import type * as vscode from 'vscode';

export class FileSystemError extends Error implements vscode.FileSystemError {
  readonly code: string;

  static FileNotFound(messageOrUri?: string | vscode.Uri): FileSystemError {
    return new FileSystemError('FileNotFound', `File not found: ${messageOrUri}`);
  }

  static FileExists(messageOrUri?: string | vscode.Uri): FileSystemError {
    return new FileSystemError('FileExists', `File exists: ${messageOrUri}`);
  }

  static FileNotADirectory(messageOrUri?: string | vscode.Uri): FileSystemError {
    return new FileSystemError('FileNotADirectory', `File not a directory: ${messageOrUri}`);
  }

  static FileIsADirectory(messageOrUri?: string | vscode.Uri): FileSystemError {
    return new FileSystemError('FileIsADirectory', `File is a directory: ${messageOrUri}`);
  }

  static NoPermissions(messageOrUri?: string | vscode.Uri): FileSystemError {
    return new FileSystemError('NoPermissions', `No permissions: ${messageOrUri}`);
  }

  static Unavailable(messageOrUri?: string | vscode.Uri): FileSystemError {
    return new FileSystemError('Unavailable', `Unavailable: ${messageOrUri}`);
  }

  private constructor(code: string, messageOrUri?: string | vscode.Uri) {
    super(typeof messageOrUri === 'string' ? messageOrUri : messageOrUri?.toString());
    this.code = code;
  }
}
