import { FileStatusType, type SourceControlSystem, type FileStatus } from '@gitlab/web-ide-fs';

export const MOCK_FILE_STATUS_DELETED: FileStatus = {
  type: FileStatusType.Deleted,
  path: './README.md',
};

export const createMockSourceControl = (mockStatus: FileStatus[] = []): SourceControlSystem => {
  return {
    status: jest.fn().mockReturnValue(mockStatus),
  };
};
