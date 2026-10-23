import * as vscode from 'vscode';
import { tryStat } from './tryStat';
import { createFakePartial } from '../../../test-utils/createFakePartial';
import { createFakeFileStat } from '../../../test-utils/vscode';

const TEST_URI = vscode.Uri.parse('gitlab-web-ide:///foo/src/test.js');
const TEST_FS = createFakePartial<vscode.FileSystem>({
  stat: jest.fn(),
});
const TEST_STAT = createFakeFileStat();

describe('utils/fs/tryStat', () => {
  it('when stat throws, returns null', async () => {
    jest.mocked(TEST_FS.stat).mockRejectedValue(new Error(''));

    await expect(tryStat(TEST_FS, TEST_URI)).resolves.toBe(null);
  });

  it('when stat resolves, calls fs.stat and return stat', async () => {
    jest.mocked(TEST_FS.stat).mockResolvedValue(TEST_STAT);

    await expect(tryStat(TEST_FS, TEST_URI)).resolves.toBe(TEST_STAT);

    expect(TEST_FS.stat).toHaveBeenCalledTimes(1);
    expect(TEST_FS.stat).toHaveBeenCalledWith(TEST_URI);
  });
});
