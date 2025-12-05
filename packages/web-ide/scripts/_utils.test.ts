import * as fs from 'fs';
import * as path from 'path';

import { renameDirectory } from './_utils';

const MOCK_BASE_PATH = '../../tmp/';

jest.mock('fs', () => ({
  __esModule: true,
  ...jest.requireActual('fs'),
}));

function createMockDirectory(dirPath: string) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
  fs.mkdirSync(dirPath, { recursive: true });

  return {
    reset: () => {
      try {
        fs.rmSync(dirPath, { recursive: true, force: true });
      } catch (err) {
        throw Error(`Failed to clean up mock directory: ${err}`);
      }
    },
  };
}

function getDirectoryPath(directoryName: string) {
  return path.resolve(__dirname, MOCK_BASE_PATH, directoryName);
}

describe('scripts/_utils/renameDirectory', () => {
  jest.spyOn(global.console, 'log');
  jest.spyOn(global.console, 'error');

  let mockDirectory: { reset: () => void };
  const mockBeforePath = getDirectoryPath('foo');
  const mockAfterPath = getDirectoryPath('bar');

  beforeEach(() => {
    mockDirectory = createMockDirectory(mockBeforePath);
  });

  afterEach(() => {
    mockDirectory.reset();
  });

  it('should rename directory', () => {
    renameDirectory(mockBeforePath, mockAfterPath);
    expect(fs.existsSync(mockAfterPath)).toBe(true);
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenCalled();
    // eslint-disable-next-line no-console
    expect(jest.mocked(console.log).mock.calls[0][0]).toMatch(/Successfully renamed/);
  });

  it('should successfully rename directory when EXDEV errors', () => {
    jest.spyOn(fs, 'renameSync').mockImplementation(() => {
      const error = new Error('Cross-device link not permitted');
      (error as NodeJS.ErrnoException).code = 'EXDEV';
      throw error;
    });

    renameDirectory(mockBeforePath, mockAfterPath);
    expect(fs.existsSync(mockAfterPath)).toBe(true);
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenCalled();
    // eslint-disable-next-line no-console
    expect(jest.mocked(console.log).mock.calls[0][0]).toMatch(/Successfully moved/);
  });
});
