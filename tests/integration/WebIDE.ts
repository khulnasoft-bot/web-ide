import type { Page } from '@playwright/test';
import { InitForm } from './pages/init-form/InitForm';
import { Workbench } from './pages/workbench/Workbench';
import { MockHttpRequest } from './network/MockHttpRequest';
import { MockGraphQLRequest } from './network/MockGraphQLRequest';

export class WebIDE {
  readonly #page: Page;

  readonly #gitlabUrl: string;

  readonly #projectPath: string;

  readonly #repositoryRef: string;

  readonly #accessToken: string;

  readonly initForm: InitForm;

  readonly workbench: Workbench;

  readonly mockHttpRequest: MockHttpRequest;

  readonly mockGraphQLRequest: MockGraphQLRequest;

  constructor(page: Page) {
    this.#page = page;
    this.#gitlabUrl = process.env.PLAYWRIGHT_GITLAB_URL || '';
    this.#projectPath = process.env.PLAYWRIGHT_PROJECT_PATH || '';
    this.#repositoryRef = process.env.PLAYWRIGHT_REPOSITORY_REF || '';
    this.#accessToken = process.env.PLAYWRIGHT_ACCESS_TOKEN || '';

    this.initForm = new InitForm({
      page: this.#page,
      gitlabUrl: this.#gitlabUrl,
      projectPath: this.#projectPath,
      repositoryRef: this.#repositoryRef,
      accessToken: this.#accessToken,
    });
    this.workbench = new Workbench({ page: this.#page });
    this.mockHttpRequest = new MockHttpRequest({
      page: this.#page,
      gitlabUrl: this.#gitlabUrl,
      projectPath: this.#projectPath,
    });
    this.mockGraphQLRequest = new MockGraphQLRequest({
      page: this.#page,
      gitlabUrl: this.#gitlabUrl,
    });
  }

  /**
   * Opens the Web IDE example app and waits for the network to be idle.
   */
  async goto(): Promise<void> {
    await this.#page.goto('/');

    await this.#page.waitForLoadState('load');
  }
}
