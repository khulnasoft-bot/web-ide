import type { FileContentProvider } from '@gitlab/web-ide-fs';
import { FileContentProviderWith404AsEmpty } from './FileContentProviderWith404AsEmpty';

const TEST_CONTENT = Buffer.from('Hello world!');
const TEST_PATH = 'foo/path';

describe('utils/fs/FileContentProviderWith404AsEmpty', () => {
  let base: FileContentProvider;
  let subject: FileContentProviderWith404AsEmpty;

  const ERROR_404_STATUS = { status: 404 };
  const ERROR_404 = new Error('Something 404 like happened');
  const ERROR_CATASTROPHIC = new Error('BOOM!');

  const createSubject = () => new FileContentProviderWith404AsEmpty(base);

  beforeEach(() => {
    base = {
      getContent: jest.fn().mockResolvedValue(TEST_CONTENT),
    };
    subject = createSubject();
  });

  it('when base resolves, passes through', async () => {
    await expect(subject.getContent(TEST_PATH)).resolves.toBe(TEST_CONTENT);

    expect(base.getContent).toHaveBeenCalledWith(TEST_PATH);
  });

  it.each`
    desc                                                  | error                 | shouldResolve
    ${'when base errors with 404 status, returns empty'}  | ${ERROR_404_STATUS}   | ${true}
    ${'when base errors with 404 message, returns empty'} | ${ERROR_404}          | ${true}
    ${'when base errors catastrophically, throws'}        | ${ERROR_CATASTROPHIC} | ${false}
  `('$desc', async ({ error, shouldResolve }) => {
    jest.mocked(base.getContent).mockRejectedValue(error);

    if (shouldResolve) {
      await expect(subject.getContent(TEST_PATH)).resolves.toEqual(new Uint8Array(0));
    } else {
      await expect(subject.getContent(TEST_PATH)).rejects.toBe(error);
    }
  });
});
