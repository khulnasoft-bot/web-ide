import * as vscode from 'vscode';
import { createWebIdeExtensionConfig } from '@gitlab/utils-test';
import { TEST_PROJECT, TEST_BRANCH, TEST_REF_COMMIT, asRef } from '../../../test-utils';
import {
  showSuccessMessage,
  ITEM_CONTINUE,
  ITEM_CREATE_MR,
  ITEM_GO_TO_PROJECT,
} from './showSuccessMessage';
import { getConfig } from '../../mediator';

jest.mock('../../mediator');

const createBranchRef = (branchName: string) =>
  asRef({
    ...TEST_BRANCH,
    name: branchName,
  });

const createMergeRequestUrl = (
  sourceBranchName: string,
  targetBranchName: string,
  targetProjectId: string = '',
) => {
  const NEW_MR_PARAMS = [
    'nav_source=webide',
    `merge_request[source_branch]=${sourceBranchName}`,
    `merge_request[target_branch]=${targetBranchName}`,
    targetProjectId && `merge_request[target_project_id]=${targetProjectId}`,
  ]
    .filter(Boolean)
    .join('&');

  return `https://gitlab.com/gitlab-org/gitlab/-/merge_requests/new?${NEW_MR_PARAMS}`;
};

const DEFAULT_ITEMS = [ITEM_GO_TO_PROJECT, ITEM_CONTINUE];

const TEST_BRANCH_NAME = 'root-main-patch-123';
const TEST_BRANCH_REF = createBranchRef(TEST_BRANCH_NAME);

const DEFAULT_BRANCH_NAME = TEST_PROJECT.default_branch;
const DEFAULT_BRANCH_REF = createBranchRef(DEFAULT_BRANCH_NAME);

const OTHER_BRANCH_NAME = 'other-branch';
const OTHER_BRANCH_REF = createBranchRef(OTHER_BRANCH_NAME);

describe('scm/commit/showSuccessMessage', () => {
  it.each`
    projectMixin                              | commitBranchName               | expectedItems
    ${{}}                                     | ${TEST_BRANCH_NAME}            | ${[ITEM_CREATE_MR, ...DEFAULT_ITEMS]}
    ${{ can_create_merge_request_in: false }} | ${TEST_BRANCH_NAME}            | ${DEFAULT_ITEMS}
    ${{ empty_repo: true }}                   | ${TEST_BRANCH_NAME}            | ${DEFAULT_ITEMS}
    ${{}}                                     | ${TEST_PROJECT.default_branch} | ${DEFAULT_ITEMS}
  `(
    'with projectMixin=$projectMixin and commitBranchName=$branchName, shows items',
    ({ projectMixin, commitBranchName, expectedItems }) => {
      const project = {
        ...TEST_PROJECT,
        ...projectMixin,
      };

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      showSuccessMessage({ project, commitBranchName, ref: TEST_BRANCH_REF });

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('successfully'),
        ...expectedItems,
      );
    },
  );

  it.each([undefined, ITEM_CONTINUE])('when user selects %s - does nothing', async item => {
    jest.mocked(vscode.window.showInformationMessage).mockResolvedValue(item);

    await showSuccessMessage({
      project: TEST_PROJECT,
      commitBranchName: TEST_BRANCH_NAME,
      ref: TEST_BRANCH_REF,
    });

    expect(vscode.env.openExternal).not.toHaveBeenCalled();
  });

  it.each`
    desc                         | item                  | ref                   | url
    ${''}                        | ${ITEM_GO_TO_PROJECT} | ${TEST_BRANCH_REF}    | ${'https://gitlab.com/gitlab-org/gitlab'}
    ${'with ref=same branch'}    | ${ITEM_CREATE_MR}     | ${TEST_BRANCH_REF}    | ${createMergeRequestUrl(TEST_BRANCH_NAME, DEFAULT_BRANCH_NAME)}
    ${'with ref=other branch'}   | ${ITEM_CREATE_MR}     | ${OTHER_BRANCH_REF}   | ${createMergeRequestUrl(TEST_BRANCH_NAME, 'other-branch', String(TEST_PROJECT.id))}
    ${'with ref=default branch'} | ${ITEM_CREATE_MR}     | ${DEFAULT_BRANCH_REF} | ${createMergeRequestUrl(TEST_BRANCH_NAME, DEFAULT_BRANCH_NAME)}
    ${'with ref=commit'}         | ${ITEM_CREATE_MR}     | ${TEST_REF_COMMIT}    | ${createMergeRequestUrl(TEST_BRANCH_NAME, DEFAULT_BRANCH_NAME)}
  `('when user selects $item $desc', async ({ item, ref, url }) => {
    jest.mocked(vscode.window.showInformationMessage).mockResolvedValue(item);
    jest.mocked(getConfig).mockResolvedValue(createWebIdeExtensionConfig());

    await showSuccessMessage({
      project: TEST_PROJECT,
      commitBranchName: TEST_BRANCH_NAME,
      ref,
    });

    expect(vscode.env.openExternal).toHaveBeenCalledWith(vscode.Uri.parse(url));
  });

  it.each`
    amend    | force    | expectedMessage
    ${false} | ${false} | ${'Your changes have been committed successfully.'}
    ${true}  | ${false} | ${'Your changes have been amended and force pushed successfully.'}
    ${false} | ${true}  | ${'Your changes have been committed and force pushed successfully.'}
    ${true}  | ${true}  | ${'Your changes have been amended and force pushed successfully.'}
  `(
    'showSuccessMessage shows correct message when amend=$amend and force=$force',
    async ({ amend, force, expectedMessage }) => {
      await showSuccessMessage({
        project: TEST_PROJECT,
        ref: TEST_BRANCH_REF,
        commitBranchName: TEST_BRANCH_NAME,
        amend,
        force,
      });

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        expectedMessage,
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    },
  );
});
