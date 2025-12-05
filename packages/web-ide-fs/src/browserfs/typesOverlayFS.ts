export type DeletedFilesLineType = 'file' | 'dir';

export interface DeletedFilesLogContents {
  readonly files: ReadonlySet<string>;
  readonly directories: ReadonlySet<string>;
}

export interface DeletedFilesLogReadonly {
  readonly path: string;
  isDeleted(p: string): Promise<boolean>;
  getContents(): Promise<DeletedFilesLogContents | null>;
  getModifiedTime(): Promise<number>;
}

export interface DeletedFilesLog extends DeletedFilesLogReadonly {
  append(type: DeletedFilesLineType, pathArg: string): Promise<void>;
}
