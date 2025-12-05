import { type Page } from '@playwright/test';

interface MockGraphQLRequestOptions {
  page: Page;
  gitlabUrl: string;
}

type AI_MESSAGE_ROLE = 'USER' | 'ASSISTANT';

export class MockGraphQLRequest {
  readonly #page: Page;

  readonly #gitlabUrl: string;

  readonly #aiMessagesQueues: Record<AI_MESSAGE_ROLE, unknown[]>;

  constructor({ page, gitlabUrl }: MockGraphQLRequestOptions) {
    this.#page = page;
    this.#gitlabUrl = gitlabUrl;
    this.#aiMessagesQueues = {
      USER: [],
      ASSISTANT: [],
    };
  }

  async initialize() {
    const graphqlUrl = `${this.#gitlabUrl}/api/graphql`;

    await this.#page.route(graphqlUrl, async route => {
      const request = route.request();

      if (request.method() !== 'POST') {
        await route.continue();
        return;
      }

      const postData = request.postDataJSON();

      if (postData?.operationName !== 'getAiMessages') {
        await route.continue();
        return;
      }

      const role = ((postData?.variables?.roles || []).pop() || 'USER') as AI_MESSAGE_ROLE;

      if (role && this.#aiMessagesQueues[role].length > 0) {
        const response = this.#aiMessagesQueues[role].shift();

        await route.fulfill({
          json: {
            data: response,
          },
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        await route.continue();
      }
    });
  }

  mockGetAiMessagesRequest(role: AI_MESSAGE_ROLE, mockResponse: unknown): void {
    this.#aiMessagesQueues[role].push(mockResponse);
  }
}
