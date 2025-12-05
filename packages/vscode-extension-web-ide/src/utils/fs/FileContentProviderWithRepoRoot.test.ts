import type { FileContentProvider } from '@gitlab/web-ide-fs';
import { FileContentProviderWithRepoRoot } from './FileContentProviderWithRepoRoot';

const TEST_CONTENT = Buffer.from('Hello world!');
const TEST_REPO_ROOT = '/gitlab-ui';

describe('utils/fs/FileContentProviderWithRepoRoot', () => {
  let base: FileContentProvider;
  let subject: FileContentProviderWithRepoRoot;

  const createSubject = () => new FileContentProviderWithRepoRoot(base, TEST_REPO_ROOT);

  beforeEach(() => {
    base = {
      getContent: jest.fn().mockResolvedValue(TEST_CONTENT),
    };
    subject = createSubject();
  });

  it('strips repo root from path and passes through', async () => {
    await expect(subject.getContent(`${TEST_REPO_ROOT}/foo/bar.js`)).resolves.toBe(TEST_CONTENT);

    expect(base.getContent).toHaveBeenCalledWith('foo/bar.js');
  });
});
