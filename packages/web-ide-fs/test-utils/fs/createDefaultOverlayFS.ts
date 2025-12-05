import { createOverlayFS, createOverlayFSComponents } from '../../src/browserfs';
import { FakeFileContentProvider } from '../FakeFileContentProvider';
import { DEFAULT_FILES, DEFAULT_FILE_ARRAY, REPO_ROOT } from './constants';

export const createDefaultOverlayFS = async () => {
  const overlayFSComponents = await createOverlayFSComponents({
    contentProvider: new FakeFileContentProvider(DEFAULT_FILES),
    gitLsTree: DEFAULT_FILE_ARRAY,
    repoRoot: REPO_ROOT,
  });

  const overlayFS = await createOverlayFS(overlayFSComponents);

  return {
    fs: overlayFS,
    ...overlayFSComponents,
  };
};
