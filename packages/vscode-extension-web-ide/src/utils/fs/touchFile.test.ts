import * as vscode from 'vscode';
import { tryStat } from './tryStat';
import { touchFile } from './touchFile';
import { createFakeFileStat } from '../../../test-utils/vscode';
import { createFakePartial } from '../../../test-utils/createFakePartial';

jest.mock('./tryStat');

const TEST_URI = vscode.Uri.parse('gitlab-web-ide:///README.md');
const TEST_URI_NESTED = vscode.Uri.parse('gitlab-web-ide:///foo/bar/README.md');
const TEST_STAT = createFakeFileStat();
const TEST_FS = createFakePartial<vscode.FileSystem>({
  createDirectory: jest.fn(),
  writeFile: jest.fn(),
});

describe('utils/fs/touchFile', () => {
  describe('when file exists', () => {
    beforeEach(async () => {
      jest.mocked(tryStat).mockResolvedValue(TEST_STAT);

      await touchFile(TEST_FS, TEST_URI);
    });

    it('checks stat of file', () => {
      expect(tryStat).toHaveBeenCalledTimes(1);
      expect(tryStat).toHaveBeenCalledWith(TEST_FS, TEST_URI);
    });

    it('does nothing', () => {
      expect(TEST_FS.createDirectory).not.toHaveBeenCalled();
      expect(TEST_FS.writeFile).not.toHaveBeenCalled();
    });
  });

  describe.each`
    uri                | createDirectoryCalls
    ${TEST_URI}        | ${[]}
    ${TEST_URI_NESTED} | ${[[vscode.Uri.parse('gitlab-web-ide:///foo/bar')]]}
  `('when file does not exist and uri=$uri', ({ uri, createDirectoryCalls }) => {
    beforeEach(async () => {
      jest.mocked(tryStat).mockResolvedValue(null);

      await touchFile(TEST_FS, uri);
    });

    it('calls writeFile', () => {
      expect(TEST_FS.writeFile).toHaveBeenCalledTimes(1);
      expect(TEST_FS.writeFile).toHaveBeenCalledWith(uri, new Uint8Array(0));
    });

    it('handles createDirectory', () => {
      expect(jest.mocked(TEST_FS.createDirectory).mock.calls).toEqual(createDirectoryCalls);
    });
  });
});
