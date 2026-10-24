import { omit } from 'lodash';

import type { WebIdeConfig, WebIdeExtensionConfig } from '@khulnasoft/web-ide-types';

export const createConfig = (): WebIdeConfig => ({
  workbenchBaseUrl: 'https://ide.foo.bar',
  embedderOriginUrl: 'https://foo.bar',
  extensionsHostBaseUrl:
    'https://{{uuid}}.cdn.web-ide.gitlab-static.net/web-ide-vscode/{{quality}}/{{commit}}',
  crossOriginExtensionHost: true,
  handleError: jest.fn(),
  handleTracking: jest.fn(),
  links: {
    feedbackIssue: 'foobar',
    userPreferences: 'user/preferences',
    signIn: 'user/signIn',
  },
  gitlabUrl: 'https://gitlab.com',
  auth: {
    type: 'token',
    token: 'very-secret-token',
  },
  projectPath: 'gitlab-org/gitlab',
  ref: 'main',
  handleContextUpdate: jest.fn(),
});

export const createWebIdeExtensionConfig = (): WebIdeExtensionConfig => ({
  ...omit(createConfig(), ['handleError', 'handleTracking', 'handleContextUpdate']),
  repoRoot: 'gitlab',
});
