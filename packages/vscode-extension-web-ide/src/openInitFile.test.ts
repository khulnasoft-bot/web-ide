import * as vscode from 'vscode';
import { PATH_ROOT } from '@khulnasoft/utils-path';
import type { WebIdeExtensionConfig } from '@khulnasoft/web-ide-types';
import { openInitFile } from './openInitFile';
import { getConfig } from './mediator';
import { VSCODE_COMMAND_KEEP_EDITOR } from './constants';
import { tryStat, touchFile } from './utils/fs';
import { createFakeFileStat } from '../test-utils/vscode';

jest.mock('./mediator');
jest.mock('./utils/fs');

const TEST_FILE_PATH = '/src/foo.md';
const TEST_REPO_ROOT = 'gitlab-repo-root';
const TEST_FULL_URI = vscode.Uri.parse('khulnasoft-web-ide:///gitlab-repo-root/src/foo.md');

const TEST_STAT_FILE = createFakeFileStat();
const TEST_STAT_DIR = createFakeFileStat(vscode.FileType.Directory);

describe('openInitFile', () => {
  describe.each`
    filePath          | stat              | isWritableFS
    ${''}             | ${TEST_STAT_FILE} | ${true}
    ${PATH_ROOT}      | ${TEST_STAT_FILE} | ${true}
    ${TEST_FILE_PATH} | ${undefined}      | ${false}
    ${TEST_FILE_PATH} | ${TEST_STAT_DIR}  | ${true}
  `(
    'when filePath="$filePath", stat=$stat, isWritableFS=$isWritableFS',
    ({ filePath, stat, isWritableFS }) => {
      beforeEach(() => {
        jest.mocked(getConfig).mockResolvedValue({ filePath } as WebIdeExtensionConfig);
        jest.mocked(tryStat).mockResolvedValue(stat);
        jest.mocked(vscode.workspace.fs.isWritableFileSystem).mockReturnValue(isWritableFS);
      });

      it('does nothing', async () => {
        await openInitFile();

        expect(vscode.window.showTextDocument).not.toHaveBeenCalled();
        expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
      });
    },
  );

  describe.each`
    desc                     | stat              | touchFileCalls
    ${'file exists'}         | ${TEST_STAT_FILE} | ${[]}
    ${'file does not exist'} | ${undefined}      | ${[[vscode.workspace.fs, TEST_FULL_URI]]}
  `('when config has filePath and $desc', ({ stat, touchFileCalls }) => {
    beforeEach(async () => {
      jest.mocked(getConfig).mockResolvedValue({
        filePath: TEST_FILE_PATH,
        repoRoot: TEST_REPO_ROOT,
      } as WebIdeExtensionConfig);
      jest.mocked(tryStat).mockResolvedValue(stat);
      jest.mocked(vscode.workspace.fs.isWritableFileSystem).mockReturnValue(true);

      await openInitFile();
    });

    it('checks the file stat', () => {
      expect(tryStat).toHaveBeenCalledTimes(1);
      expect(tryStat).toHaveBeenCalledWith(vscode.workspace.fs, TEST_FULL_URI);
    });

    it('opens the file', () => {
      expect(vscode.window.showTextDocument).toHaveBeenCalledTimes(1);
      expect(vscode.window.showTextDocument).toHaveBeenCalledWith(TEST_FULL_URI);
    });

    it('keeps current active editor open', () => {
      expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(1);
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(VSCODE_COMMAND_KEEP_EDITOR);
    });

    it('handles touchFile', () => {
      expect(jest.mocked(touchFile).mock.calls).toEqual(touchFileCalls);
    });
  });
});
