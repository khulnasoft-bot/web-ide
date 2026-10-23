import type {
  gitlab,
  DeprecatedGitLabClient as GitLabClient,
  ProjectUserPermissions,
} from '@gitlab/gitlab-api-client';
import {
  createRepositoryTreeItem,
  createTestBranch,
  createTestClient,
  createTestProject,
  TEST_CONFIG,
  TEST_COMMIT_ID,
  TEST_DEFAULT_BRANCH,
} from '../../test-utils';
import type { StartCommandResponse } from '../types';
import { fetchProject } from './fetchProject';
import * as start from './start';

jest.mock('./fetchProject');

const TEST_BLOBS: gitlab.RepositoryTreeItem[] = [
  createRepositoryTreeItem('foo.md', 'blob'),
  createRepositoryTreeItem('src/README.md', 'blob'),
];
const TEST_TREE_RESPONSE: gitlab.RepositoryTreeItem[] = [
  ...TEST_BLOBS,
  createRepositoryTreeItem('src', 'tree'),
];
const TEST_MR_CONFIG = { ...TEST_CONFIG, ref: '', mrId: '7' };
const TEST_FORK_INFO_CONFIG = { ...TEST_CONFIG, forkInfo: { ide_path: '/ide' } };
const TEST_MR: gitlab.MergeRequest = {
  id: 7007,
  iid: 7,
  source_branch: 'mr-source-branch',
  source_project_id: 10,
  target_branch: 'mr-target-branch',
  target_project_id: 17,
  web_url: 'https://gitlab.example.com/mr/1',
  diff_refs: {
    base_sha: '000001',
    head_sha: '000002',
    start_sha: '000003',
  },
};
const TEST_PROJECT = createTestProject(TEST_CONFIG.projectPath);
const TEST_EMPTY_PROJECT = { ...TEST_PROJECT, empty_repo: true };
const TEST_USER_PERMISSIONS: ProjectUserPermissions = {
  createMergeRequestIn: false,
  pushCode: true,
  readMergeRequest: false,
};

describe('vscode-mediator-commands/commands/start', () => {
  let client: jest.Mocked<GitLabClient>;
  let command: ReturnType<typeof start.commandFactory>;
  let result: StartCommandResponse;

  beforeEach(() => {
    client = createTestClient() as jest.Mocked<GitLabClient>;

    jest.spyOn(client, 'fetchProjectUserPermissions').mockResolvedValue(TEST_USER_PERMISSIONS);
    jest
      .spyOn(client, 'fetchProjectBranch')
      .mockImplementation((projectPath, ref) =>
        Promise.resolve(createTestBranch(projectPath, ref)),
      );
    jest.spyOn(client, 'fetchTree').mockImplementation(() => Promise.resolve(TEST_TREE_RESPONSE));
    jest.spyOn(client, 'fetchMergeRequest').mockResolvedValue(TEST_MR);

    jest.mocked(fetchProject).mockResolvedValue(TEST_PROJECT);
  });

  describe.each`
    desc                       | configMixin    | args                         | expectedRef
    ${'without ref in config'} | ${{ ref: '' }} | ${[]}                        | ${TEST_DEFAULT_BRANCH}
    ${'without args'}          | ${{}}          | ${[]}                        | ${TEST_CONFIG.ref}
    ${'with ref in options'}   | ${{}}          | ${[{ ref: 'new-test-ref' }]} | ${'new-test-ref'}
  `('$desc', ({ args, expectedRef, configMixin }) => {
    beforeEach(async () => {
      command = start.commandFactory({ ...TEST_CONFIG, ...configMixin }, client);

      result = await command(...args);
    });

    it('returns result', () => {
      expect(result).toEqual({
        ref: {
          type: 'branch',
          branch: createTestBranch(TEST_CONFIG.projectPath, expectedRef),
          sha: TEST_COMMIT_ID,
        },
        project: TEST_PROJECT,
        repoRoot: TEST_CONFIG.repoRoot,
        files: TEST_BLOBS,
        gitlabUrl: TEST_CONFIG.gitlabUrl,
        userPermissions: TEST_USER_PERMISSIONS,
      });
    });

    it('calls clients', () => {
      expect(client.fetchProjectUserPermissions).toHaveBeenCalledWith(TEST_CONFIG.projectPath);
      expect(fetchProject).toHaveBeenCalledWith(
        { ...TEST_CONFIG, ...configMixin },
        client.defaultClient,
      );
      expect(client.fetchProjectBranch).toHaveBeenCalledWith(TEST_CONFIG.projectPath, expectedRef);
      expect(client.fetchTree).toHaveBeenCalledWith(TEST_CONFIG.projectPath, TEST_COMMIT_ID);
    });

    it('does not call merge request', () => {
      expect(client.fetchMergeRequest).not.toHaveBeenCalled();
    });
  });

  describe.each`
    desc                               | configMixin                                 | ref                      | expectedFetchArgs             | branchName               | isMergeRequestBranch
    ${'default'}                       | ${{}}                                       | ${''}                    | ${['gitlab-org/gitlab', '7']} | ${TEST_MR.source_branch} | ${true}
    ${'ref arg'}                       | ${{}}                                       | ${'foo'}                 | ${['gitlab-org/gitlab', '7']} | ${'foo'}                 | ${false}
    ${'ref arg matches source branch'} | ${{}}                                       | ${TEST_MR.source_branch} | ${['gitlab-org/gitlab', '7']} | ${TEST_MR.source_branch} | ${true}
    ${'with mrTargetProject'}          | ${{ mrTargetProject: 'mr-target/project' }} | ${TEST_MR.source_branch} | ${['mr-target/project', '7']} | ${TEST_MR.source_branch} | ${true}
  `(
    'with mrId - $desc',
    ({ configMixin, ref, expectedFetchArgs, branchName, isMergeRequestBranch }) => {
      beforeEach(async () => {
        command = start.commandFactory({ ...TEST_MR_CONFIG, ...configMixin }, client);

        result = await command({ ref });
      });

      it('fetches merge request', () => {
        expect(client.fetchMergeRequest).toHaveBeenCalledWith(...expectedFetchArgs);
      });

      it('returns branch and mr data in result', () => {
        expect(result).toMatchObject({
          ref: {
            type: 'branch',
            branch: {
              name: branchName,
            },
            sha: TEST_COMMIT_ID,
          },
          mergeRequest: {
            id: String(TEST_MR.id),
            baseSha: TEST_MR.diff_refs.base_sha,
            mergeRequestUrl: TEST_MR.web_url,
            isMergeRequestBranch,
          },
        });
      });
    },
  );

  describe('with forkInfo', () => {
    beforeEach(async () => {
      command = start.commandFactory(TEST_FORK_INFO_CONFIG, client);

      result = await command();
    });

    it('returns forkInfo in result', () => {
      expect(result).toMatchObject({
        forkInfo: TEST_FORK_INFO_CONFIG.forkInfo,
      });
    });
  });

  describe('when project is empty', () => {
    beforeEach(async () => {
      jest.mocked(fetchProject).mockResolvedValue(TEST_EMPTY_PROJECT);
      command = start.commandFactory(TEST_CONFIG, client);
      result = await command();
    });

    it('command returns empty project result', () => {
      expect(result).toEqual({
        ref: {
          type: 'branch',
          sha: '',
          branch: {
            name: TEST_CONFIG.ref,
            web_url: '',
            can_push: true,
            default: false,
            protected: false,
            commit: {
              created_at: '',
              id: '',
              message: '',
              short_id: '',
              title: '',
              web_url: '',
            },
          },
        },
        project: TEST_EMPTY_PROJECT,
        repoRoot: TEST_CONFIG.repoRoot,
        files: [],
        gitlabUrl: TEST_CONFIG.gitlabUrl,
        userPermissions: TEST_USER_PERMISSIONS,
      });
    });

    it('does not fetch branch or tree', () => {
      expect(client.fetchProjectBranch).not.toHaveBeenCalled();
      expect(client.fetchTree).not.toHaveBeenCalled();
    });
  });
});
