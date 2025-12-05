import { test as setup, expect } from '@playwright/test';

setup('assert expect environment variables', async () => {
  [
    { name: 'PLAYWRIGHT_GITLAB_URL', value: process.env.PLAYWRIGHT_GITLAB_URL },
    { name: 'PLAYWRIGHT_PROJECT_PATH', value: process.env.PLAYWRIGHT_PROJECT_PATH },
    { name: 'PLAYWRIGHT_REPOSITORY_REF', value: process.env.PLAYWRIGHT_REPOSITORY_REF },
    { name: 'PLAYWRIGHT_ACCESS_TOKEN', value: process.env.PLAYWRIGHT_ACCESS_TOKEN },
  ].forEach(envVar => {
    const message = `${envVar.name} environment variable is not set. This is required for running the tests in the Web IDE.`;
    expect(envVar.value, message).not.toBeUndefined();
  });
});
