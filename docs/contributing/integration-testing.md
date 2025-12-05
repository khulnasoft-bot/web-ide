# Integration Testing with Playwright

This document describes how to set up, run, and write integration tests using Playwright.

## Overview

The integration tests use Playwright to automate browser interactions and test the Web IDE functionality in a
real browser environment. The tests are located in the `tests/integration` directory. The integration tests
exercise the integration between the major subsystems that conform the Web IDE:

- GitLab VSCode Fork.
- The Web IDE VSCode extension.
- The GitLab VSCode extension.
- The GitLab REST and GraphQL API.

Integration tests prioritize reliability over using a real GitLab REST or GraphQL APIs. These tests
mock API requests that return unpredictable responses.

## Setup

1. Follow the project's [general setup guide](./development-environment-setup.md#setup).

1. Install Playwright browsers:

   ```bash
   yarn playwright:install
   ```

1. Set the the following environment variables in the `config/.env.local` file:

   ```bash
   # GitLab instance URL (choose one)
   PLAYWRIGHT_GITLAB_URL="https://gdk.test:3443"
   PLAYWRIGHT_GITLAB_URL="https://gitlab.com"


   # Project path
   PLAYWRIGHT_PROJECT_PATH="gitlab-org/gitlab-shell"

   # Project repository ref
   PLAYWRIGHT_REPOSITORY_REF="main"

   # Personal or project access token to authenticate HTTP requests
   PLAYWRIGHT_ACCESS_TOKEN="your_gitlab_access_token"
   ```

## Running Tests

Run all E2E tests:

```bash
yarn test:integration
```

Run a specific test:

```bash
yarn test:integration tests/integration/web-ide.spec.ts
```

Run tests in a single browser:

```bash
yarn test:integration --project chromium
```

Run tests in UI mode:

```bash
yarn test:integration --ui
```

Run in headed mode

```bash
yarn test:integration --headed
```

For more information, read [how to run and debug tests](https://playwright.dev/docs/running-tests)
in the Playwright documentation.

## CI

The Web IDE project's pipeline runs integration tests in the `integration-tests` job. If the
integration tests fail, playwright generates videos that you can find in the CI jobs' generated
artifacts.

## Playwright configuration

The Playwright configuration is defined in `tests/integration/playwright.config.ts`. It includes:

- Environment variables initialization.
- Test reporter configuration.
- Web server setup: Automatically starts the example app server.
- Web Browser configurations: Tests run in Chromium, Firefox, and WebKit by default.

## Writing tests

The Web IDE integration tests follow the Page Object Model (POM) pattern,
which helps create maintainable and reusable test code. The `tests/integration/web-ide-source-control.test.ts`
file provides a good example of how to structure your tests.

### Testing principles

- Encapsulate selectors in a component or page class. Read the [page object model](https://playwright.dev/docs/pom)
  documentation for more details.
- Use [role-based selectors](https://playwright.dev/docs/locators#locate-by-role) to select elements
  in the page. This ensures that the tests are written from a user perspective.
- Mock network requests that can make a test unreliable or that might return unpredictable responses like
  code suggestions, chat responses, or a file's content.

### Test Structure

When adding new tests:

1. Create a new `.test.ts` file in the `tests/integration` directory.
2. Import the required test utilities and components:
   ```typescript
   import { test, expect } from '@playwright/test';
   import { WebIDE } from './WebIDE';
   import { getFixture } from './utils';
   ```
3. Use the WebIDE class to interact with the application:

   ```typescript
   test('your test description', async ({ page }) => {
     const webIde = new WebIDE(page);
     const { workbench, initForm, mockHttpRequest } = webIde;

     // Test steps go here
   });
   ```

### Using the WebIDE Class

The `WebIDE` class is the main entry point for interacting with the Web IDE in tests. It provides:

- `initForm`: For initializing the Web IDE with GitLab URL, project path, etc.
- `workbench`: For interacting with the Web IDE UI components
- `mockHttpRequest`: For mocking network requests to GitLab API

Example of initializing the Web IDE:

```typescript
await webIde.goto(); // Navigate to the Web IDE
await initForm.initWebIDE(); // Initialize with environment variables
```

### Working with UI Components

The Web IDE tests use a component-based approach:

1. **Workbench**: The main UI container

   ```typescript
   // Access the files explorer
   await workbench.filesExplorer.openFile('filename.txt');

   // Interact with the text editor
   const textEditor = workbench.textEditor.getFileTextEditor('filename.txt');
   await textEditor.focus();
   ```

2. **FilesExplorer**: For interacting with the file tree

   ```typescript
   await workbench.filesExplorer.openFile('filename.txt');
   ```

3. **TextEditor**: For interacting with the code editor

   ```typescript
   // Get a file tab
   await expect(workbench.textEditor.getFileTab('filename.txt')).toBeVisible();

   // Get and interact with the text editor
   const textEditor = workbench.textEditor.getFileTextEditor('filename.txt');
   await textEditor.focus();
   await expect(textEditor).toHaveValue(expectedContent);
   ```

### Mocking Network Requests

Use the `mockHttpRequest` to intercept and mock API requests:

```typescript
// Mock a raw file request
await mockHttpRequest.mockRawFileRequest('filename.txt', fileContent);
```

### Using Test Fixtures

Fixtures help manage test data:

```typescript
// Load a fixture file
const fileContent = await getFixture('fileContent.txt', 'text');

// For JSON fixtures
const jsonData = await getFixture('data.json', 'json');
```

Fixture files should be placed in the `tests/integration/fixtures` directory.

### Complete Example

Here's a complete example based on the source control test:

```typescript
import { expect, test } from '@playwright/test';
import { WebIDE } from './WebIDE';
import { getFixture } from './utils';

test('opens a file in the Web IDE', async ({ page }) => {
  const fileName = 'CONTRIBUTING.md';
  const webIde = new WebIDE(page);
  const { workbench, initForm, mockHttpRequest } = webIde;

  // Load test data from fixtures
  const fileContent = await getFixture('fileContent.txt', 'text');

  // Mock network requests
  await mockHttpRequest.mockRawFileRequest(fileName, fileContent);

  // Navigate to the Web IDE
  await webIde.goto();

  // Initialize the Web IDE with environment variables
  await initForm.initWebIDE();

  // Open a file in the explorer
  await workbench.filesExplorer.openFile(fileName);

  // Verify the file tab is visible
  await expect(workbench.textEditor.getFileTab(fileName)).toBeVisible();

  // Get the text editor for the file
  const textEditor = workbench.textEditor.getFileTextEditor(fileName);
  await textEditor.focus();

  // Verify the file content
  await expect(textEditor).toHaveValue(fileContent);
});
```
