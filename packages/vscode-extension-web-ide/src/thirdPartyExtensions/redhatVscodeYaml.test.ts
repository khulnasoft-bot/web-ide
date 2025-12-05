import type { WebIdeExtensionConfig } from '@gitlab/web-ide-types';
import * as vscode from 'vscode';

import { FS_SCHEME } from '../constants';
import { getConfig } from '../mediator';
import { requestSchemaContent, RECOGNIZED_SCHEMES } from './redhatVscodeYaml';

jest.mock('../mediator');

const MOCK_REPO_ROOT = 'root';
const MOCK_URI_STR = `${FS_SCHEME}://~/path/my-schema.json`;

describe('requestSchemaContent', () => {
  beforeEach(() => {
    jest.mocked(getConfig).mockResolvedValue({ repoRoot: MOCK_REPO_ROOT } as WebIdeExtensionConfig);
  });

  it.each(RECOGNIZED_SCHEMES)(
    'converts recognized URI scheme to a Web IDE compatible one: %s',
    async scheme => {
      const resource = `${scheme}://~/path/my-schema.json`;
      await requestSchemaContent(resource);
      expect(jest.mocked(vscode.workspace.fs.readFile)).toHaveBeenCalledWith(
        expect.objectContaining({ scheme: FS_SCHEME }),
      );
    },
  );

  it('throws error if resource contains unrecognized URI scheme', async () => {
    const unrecognizedScheme = 'bad';
    const resource = `${unrecognizedScheme}://~/path/my-schema.json`;
    await expect(requestSchemaContent(resource)).rejects.toThrow(
      `Unrecognized scheme ${unrecognizedScheme}`,
    );
  });

  it('appends repo root to path', async () => {
    await requestSchemaContent(MOCK_URI_STR);
    expect(jest.mocked(vscode.workspace.fs.readFile)).toHaveBeenCalledWith(
      expect.objectContaining({ path: `/${MOCK_REPO_ROOT}/path/my-schema.json` }),
    );
  });

  it('shows error message if file cannot be read', async () => {
    jest.mocked(vscode.workspace.fs.readFile).mockRejectedValueOnce(new Error('File not found'));
    await requestSchemaContent(MOCK_URI_STR);
    await expect(jest.mocked(vscode.window.showErrorMessage)).toHaveBeenCalledWith(
      `Cannot read YAML schema: ${MOCK_URI_STR}`,
    );
  });

  it('removes `~` from path if it exists', async () => {
    const mockBadUriStr = `gitlab-web-ide:/~/path/to/file.json`;
    await requestSchemaContent(mockBadUriStr);
    expect(jest.mocked(vscode.workspace.fs.readFile)).toHaveBeenCalledWith(
      expect.objectContaining({ path: `/${MOCK_REPO_ROOT}/path/to/file.json` }),
    );
  });
});
