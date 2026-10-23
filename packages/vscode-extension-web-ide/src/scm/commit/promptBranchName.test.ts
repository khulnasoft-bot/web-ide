import * as vscode from 'vscode';
import type { WebIdeExtensionConfig } from '@gitlab/web-ide-types';
import { generateBranchName } from './generateBranchName';
import type { BranchSelection } from './promptBranchName';
import { promptBranchName } from './promptBranchName';
import { getConfig } from '../../mediator';

jest.mock('./generateBranchName');
jest.mock('../../mediator');

const TEST_BRANCH = 'test-main';
const TEST_GENERATED_BRANCH = 'test-main-path-123';
const TEST_CONFIG: Partial<WebIdeExtensionConfig> = {
  username: 'loremuser',
};

describe('scm/commit/promptBranchName', () => {
  let resolveInputBox: (value: string | undefined) => void;
  let result: Promise<BranchSelection | undefined>;

  beforeEach(() => {
    jest.spyOn(vscode.window, 'showInputBox').mockImplementation(
      () =>
        new Promise(resolve => {
          resolveInputBox = resolve;
        }),
    );

    jest.mocked(generateBranchName).mockReturnValue(TEST_GENERATED_BRANCH);
    jest.mocked(getConfig).mockResolvedValue(TEST_CONFIG as WebIdeExtensionConfig);

    result = promptBranchName(TEST_BRANCH);
  });

  it('shows input box requesting a branch name', () => {
    expect(vscode.window.showInputBox).toHaveBeenCalledWith({
      ignoreFocusOut: true,
      placeHolder: `Leave empty to use "${TEST_GENERATED_BRANCH}"`,
      title: 'Create a new branch and commit',
    });
  });

  it('passes username to generateBranchName', () => {
    expect(generateBranchName).toHaveBeenCalledWith(TEST_BRANCH, TEST_CONFIG.username);
  });

  it.each`
    inputBoxResult        | expectation
    ${undefined}          | ${undefined}
    ${''}                 | ${{ isNewBranch: true, branchName: TEST_GENERATED_BRANCH }}
    ${'brand-new-branch'} | ${{ isNewBranch: true, branchName: 'brand-new-branch' }}
  `(
    'with inputBox resolves with $inputBoxResult, returns $expectation',
    async ({ inputBoxResult, expectation }) => {
      resolveInputBox(inputBoxResult);

      await expect(result).resolves.toEqual(expectation);
    },
  );
});
