import { DefaultFileList } from './FileList';
import type { SourceControlSystem } from './types';
import { FileStatusType } from './types';
import { DEFAULT_FILE_ARRAY } from '../test-utils/fs';

const INIT_BLOBS = DEFAULT_FILE_ARRAY.map(x => x.path);

describe('FileList', () => {
  let sourceControl: jest.Mocked<SourceControlSystem>;
  let subject: DefaultFileList;

  beforeEach(() => {
    sourceControl = {
      status: jest.fn().mockResolvedValue([]),
    };

    subject = new DefaultFileList({ initBlobs: INIT_BLOBS, sourceControl });
  });

  it('with empty status, lists all blobs', async () => {
    const result = await subject.listAllBlobs();

    // Order doesn't matter
    expect(result.sort()).toEqual([
      '/README.md',
      '/foo/README.md',
      '/foo/bar/index.js',
      '/tmp/.gitkeep',
    ]);
  });

  it('with status, removes deleted and concats added', async () => {
    sourceControl.status.mockResolvedValue([
      { type: FileStatusType.Deleted, path: '/foo/README.md' },
      { type: FileStatusType.Deleted, path: '/foo/bar/index.js' },
      { type: FileStatusType.Modified, path: '/README.md', content: Buffer.from('') },
      { type: FileStatusType.Created, path: '/index.js', content: Buffer.from('') },
      { type: FileStatusType.Created, path: '/src/coollibs.js', content: Buffer.from('') },
    ]);

    const result = await subject.listAllBlobs();
    expect(result.sort()).toEqual(['/README.md', '/index.js', '/src/coollibs.js', '/tmp/.gitkeep']);
  });
});
