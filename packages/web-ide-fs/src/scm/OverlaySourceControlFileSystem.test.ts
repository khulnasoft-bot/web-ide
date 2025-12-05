import { FileFlag } from 'browserfs/dist/node/core/file_flag';
import {
  REPO_ROOT,
  DEFAULT_FILES,
  stringToBuffer,
  createDefaultOverlayFS,
} from '../../test-utils/fs';
import { OverlaySourceControlFileSystem } from './OverlaySourceControlFileSystem';
import { MODE_DEFAULT, MODE_DEFAULT_FULL } from '../constants';
import { FileType } from '../types';
import { DEFAULT_DATE } from '../browserfs/GitLabReadableFileSystem';
import type { ReadonlyPromisifiedBrowserFS, PromisifiedBrowserFS } from '../browserfs/types';

const TEST_NEW_CONTENT = '# Description\n\nHello world from a test file!\n';
const TEST_PATH = `/${REPO_ROOT}/README.md`;
const TEST_DATE = new Date('2022-10-10');

describe('scm/OverlaySourceControlFileSystem', () => {
  let fs: PromisifiedBrowserFS;
  let original: ReadonlyPromisifiedBrowserFS;
  let subject: OverlaySourceControlFileSystem;

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(TEST_DATE);

    ({ fs, readable: original } = await createDefaultOverlayFS());

    subject = new OverlaySourceControlFileSystem(fs, original);

    [fs, original].forEach(x => {
      jest.spyOn(x, 'stat');
      jest.spyOn(x, 'readFile');
    });

    // Make a change so there's a difference between readable and fs
    await fs.writeFile(
      TEST_PATH,
      TEST_NEW_CONTENT,
      'utf-8',
      FileFlag.getFileFlag('w'),
      MODE_DEFAULT,
    );
  });

  const EXPECTED_STAT = {
    type: FileType.Blob,
    size: 45,
    mtime: TEST_DATE.getTime(),
    ctime: TEST_DATE.getTime(),
    mode: MODE_DEFAULT_FULL,
  };

  const EXPECTED_STAT_ORIGINAL = {
    type: FileType.Blob,
    size: -1,
    mtime: DEFAULT_DATE.getTime(),
    ctime: DEFAULT_DATE.getTime(),
    mode: MODE_DEFAULT_FULL,
  };

  describe.each`
    fnName            | expected                  | triggeredSpy           | ignoredSpy
    ${'stat'}         | ${EXPECTED_STAT}          | ${() => fs.stat}       | ${() => original.stat}
    ${'statOriginal'} | ${EXPECTED_STAT_ORIGINAL} | ${() => original.stat} | ${() => fs.stat}
  `('$fnName', ({ fnName, expected, triggeredSpy, ignoredSpy }) => {
    const act = () => subject[fnName as keyof OverlaySourceControlFileSystem](TEST_PATH);

    it('returns stat', async () => {
      await expect(act()).resolves.toEqual(expected);
    });

    it('calls appropriate file system', async () => {
      await act();

      expect(triggeredSpy()).toHaveBeenCalled();
      expect(ignoredSpy()).not.toHaveBeenCalled();
    });
  });

  describe.each`
    fnName                | expected                      | triggeredSpy               | ignoredSpy
    ${'readFile'}         | ${TEST_NEW_CONTENT}           | ${() => fs.readFile}       | ${() => original.readFile}
    ${'readFileOriginal'} | ${DEFAULT_FILES['README.md']} | ${() => original.readFile} | ${() => fs.readFile}
  `('$fnName', ({ fnName, expected, triggeredSpy, ignoredSpy }) => {
    const act = () => subject[fnName as keyof OverlaySourceControlFileSystem](TEST_PATH);

    it('returns contents', async () => {
      await expect(act()).resolves.toEqual(stringToBuffer(expected));
    });

    it('calls appropriate file system', async () => {
      await act();

      expect(triggeredSpy()).toHaveBeenCalled();
      expect(ignoredSpy()).not.toHaveBeenCalled();
    });
  });
});
