import type { DefaultGitLabClient, gitlab } from '@gitlab/gitlab-api-client';
import { gitlabApi } from '@gitlab/gitlab-api-client';
import type { WebIdeExtensionConfig } from '@khulnasoft/web-ide-types';
import type { GitLabProject } from '../types';

export const fetchProject = async (
  config: WebIdeExtensionConfig,
  client: DefaultGitLabClient,
): Promise<GitLabProject> => {
  const project: GitLabProject = await client.fetchFromApi(
    gitlabApi.getProject.createRequest({
      projectId: config.projectPath,
    }),
  );
  if (config.featureFlags?.projectPushRules) {
    const pushRules: gitlab.ProjectPushRules = await client.fetchFromApi(
      gitlabApi.getProjectPushRules.createRequest({
        projectId: config.projectPath,
      }),
    );
    project.push_rules = pushRules;
  }
  return project;
};
