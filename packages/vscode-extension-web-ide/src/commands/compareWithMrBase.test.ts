import * as vscode from 'vscode';
import { FS_SCHEME, MR_SCHEME } from '../constants';
import compareWithMrBase from './compareWithMrBase';

const DEFAULT_PATH = '/gitlab-ui/src/default.js';
const DEFAULT_TITLE = 'default.js';

describe('commands/compareWithMrBase', () => {
  beforeEach(() => {
    const document: Partial<vscode.TextDocument> = {
      uri: vscode.Uri.from({ scheme: FS_SCHEME, path: DEFAULT_PATH }),
    };
    const activeTextEditor: Partial<vscode.TextEditor> = {
      document: document as vscode.TextDocument,
    };

    vscode.window.activeTextEditor = activeTextEditor as vscode.TextEditor;
  });

  it.each`
    path                      | options               | expectedPath              | expectedTitle    | expectedOptions
    ${'/gitlab-ui/README.md'} | ${{}}                 | ${'/gitlab-ui/README.md'} | ${'README.md'}   | ${{ preview: true }}
    ${'/gitlab-ui/README.md'} | ${{ preview: false }} | ${'/gitlab-ui/README.md'} | ${'README.md'}   | ${{ preview: false }}
    ${''}                     | ${{}}                 | ${DEFAULT_PATH}           | ${DEFAULT_TITLE} | ${{ preview: true }}
  `(
    'with (path=$path, options=$options), executed vscode.diff',
    async ({ path, options, expectedPath, expectedTitle, expectedOptions }) => {
      const uri = path ? vscode.Uri.from({ scheme: FS_SCHEME, path }) : undefined;

      expect(vscode.commands.executeCommand).not.toHaveBeenCalled();

      await compareWithMrBase(uri, [], options);

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'vscode.diff',
        vscode.Uri.from({ scheme: MR_SCHEME, path: expectedPath }),
        vscode.Uri.from({ scheme: FS_SCHEME, path: expectedPath }),
        expectedTitle,
        expectedOptions,
      );
    },
  );

  it('without activeTextEditor and called with undefined, does nothing', async () => {
    vscode.window.activeTextEditor = undefined;

    await compareWithMrBase();

    expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
  });
});
