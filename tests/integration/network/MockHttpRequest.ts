import { type Page } from '@playwright/test';
import { getFixture } from '../utils';

interface MockHttpRequestOptions {
  page: Page;
  gitlabUrl: string;
  projectPath: string;
}

export class MockHttpRequest {
  readonly #page: Page;

  readonly #gitlabUrl: string;

  readonly #projectPath: string;

  constructor({ page, gitlabUrl, projectPath }: MockHttpRequestOptions) {
    this.#page = page;
    this.#gitlabUrl = gitlabUrl;
    this.#projectPath = projectPath;
  }

  async mockRawFileRequest(fileName: string, fileContent: string): Promise<void> {
    const url = `${this.#getBaseApiUrl()}/repository/files/${encodeURIComponent(fileName)}/raw**`;

    await this.#page.route(url, async route => {
      await route.fulfill({ body: fileContent, contentType: 'text/plain' });
    });
  }

  async mockCommitRequest() {
    // getBaseApiUrl doesn't apply here as request url is using projectId
    // example: https://gdk.test:3443/api/v4/projects/2/repository/commits
    const url = `**/repository/commits`;

    const { fileContent: mockResponse } = await getFixture('commitResponse.json', 'json');

    await this.#page.route(url, async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ json: mockResponse });
      } else {
        await route.continue();
      }
    });
  }

  async mockCodeSuggestionsRequest(codeSuggestions: unknown) {
    const url = `${this.#gitlabUrl}/api/v4/code_suggestions/completions`;

    await this.#page.route(url, async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ json: codeSuggestions });
      } else {
        await route.continue();
      }
    });

    await this.#page.route('https://cloud.gitlab.com/ai/v2/completions', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ json: codeSuggestions });
      } else {
        await route.continue();
      }
    });
  }

  #getBaseApiUrl() {
    return `${this.#gitlabUrl}/api/v4/projects/${encodeURIComponent(this.#projectPath)}`;
  }
}
