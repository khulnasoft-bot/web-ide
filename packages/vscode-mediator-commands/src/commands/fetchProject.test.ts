import type { DefaultGitLabClient } from '@khulnasoft/khulnasoft-api-client';
import type { WebIdeExtensionConfig } from '@khulnasoft/web-ide-types';
import { createTestClient, createTestProject, TEST_CONFIG } from '../../test-utils';
import type { GitLabProject } from '../types';
import * as fetchProjectFile from './fetchProject';

const TEST_PROJECT = createTestProject(TEST_CONFIG.projectPath);
const TEST_PUSH_RULES: GitLabProject['push_rules'] = {
  commit_message_regex: '',
  commit_message_negative_regex: '',
};

describe('vscode-mediator-commands/commands/fetchProject', () => {
  let client: DefaultGitLabClient;
  let result: GitLabProject;

  beforeEach(async () => {
    client = createTestClient().defaultClient;

    jest
      .spyOn(client, 'fetchFromApi')
      .mockResolvedValueOnce({ ...TEST_PROJECT })
      .mockResolvedValueOnce({ ...TEST_PUSH_RULES });
  });

  describe('default', () => {
    beforeEach(async () => {
      result = await fetchProjectFile.fetchProject(TEST_CONFIG, client);
    });

    it('returns result', () => {
      expect(result).toEqual(TEST_PROJECT);
    });

    it('calls clients', () => {
      expect(jest.mocked(client.fetchFromApi).mock.calls).toEqual([
        [
          {
            method: 'GET',
            path: 'projects/gitlab-org%2Fgitlab',
            type: 'rest',
          },
        ],
      ]);
    });
  });

  describe('find push rules', () => {
    beforeEach(async () => {
      const config: WebIdeExtensionConfig = {
        ...TEST_CONFIG,
        featureFlags: { projectPushRules: true },
      };
      result = await fetchProjectFile.fetchProject(config, client);
    });

    it('returns result', () => {
      // console.log(result)
      expect(result).toStrictEqual({ ...TEST_PROJECT, push_rules: TEST_PUSH_RULES });
    });

    it('calls clients', () => {
      expect(jest.mocked(client.fetchFromApi).mock.calls).toEqual([
        [
          {
            method: 'GET',
            path: 'projects/gitlab-org%2Fgitlab',
            type: 'rest',
          },
        ],
        [
          {
            method: 'GET',
            path: 'projects/gitlab-org%2Fgitlab/push_rule',
            type: 'rest',
          },
        ],
      ]);
    });
  });
});
