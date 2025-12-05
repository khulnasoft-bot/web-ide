import Stats, { FileType as BFSFileType } from 'browserfs/dist/node/core/node_fs_stats';
import { FileType } from '../../types';
import { convertToFileType, convertToFileStats } from './convert';

const TEST_FILE_STATS = new Stats(
  BFSFileType.FILE,
  799,
  0x777,
  new Date(2022, 6, 11),
  new Date(2022, 6, 12),
  new Date(2022, 6, 13),
);
const TEST_DIR_STATS = new Stats(BFSFileType.DIRECTORY, -1, 0x777);

describe('browserfs/utils/convert', () => {
  describe('convertToFileType', () => {
    it.each`
      desc                | stat               | expected
      ${'with file stat'} | ${TEST_FILE_STATS} | ${FileType.Blob}
      ${'with dir stat'}  | ${TEST_DIR_STATS}  | ${FileType.Tree}
    `('$desc', ({ stat, expected }) => {
      expect(convertToFileType(stat)).toBe(expected);
    });
  });

  describe('convertToFileStats', () => {
    it('coverts stat to IFileStats', () => {
      expect(convertToFileStats(TEST_FILE_STATS)).toEqual({
        ctime: TEST_FILE_STATS.ctime.getTime(),
        mtime: TEST_FILE_STATS.mtime.getTime(),
        size: TEST_FILE_STATS.size,
        mode: TEST_FILE_STATS.mode,
        type: FileType.Blob,
      });
    });
  });
});
