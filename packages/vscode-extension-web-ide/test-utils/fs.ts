import { FileSystem } from '@gitlab/web-ide-fs';

export const createFileSystemMock = (): jest.Mocked<FileSystem> => ({
  stat: jest.fn().mockResolvedValue({
    ctime: 0,
    mode: 0,
    mtime: 0,
    size: 0,
    type: 0,
  }),
  readdir: jest.fn().mockResolvedValue([]),
  readdirWithTypes: jest.fn().mockResolvedValue([]),
  mkdir: jest.fn(),
  readFile: jest.fn().mockResolvedValue(new Uint8Array()),
  writeFile: jest.fn(),
  rm: jest.fn(),
  rename: jest.fn(),
  lastModifiedTime: jest.fn().mockResolvedValue(0),
});
