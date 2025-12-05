import { expect, test } from '@playwright/test';
import { WebIDE } from './WebIDE';
import { getFixture } from './utils';
import type { Workbench } from './pages/workbench/Workbench';
import type { InitForm } from './pages/init-form/InitForm';
import type { MockHttpRequest } from './network/MockHttpRequest';

let webIde: WebIDE;
let workbench: Workbench;
let initForm: InitForm;
let mockHttpRequest: MockHttpRequest;

test.beforeEach(async ({ page }) => {
  webIde = new WebIDE(page);
  workbench = webIde.workbench;
  initForm = webIde.initForm;
  mockHttpRequest = webIde.mockHttpRequest;

  // Opens the Web IDE example app.
  await webIde.goto();

  // Fills in the GitLab URL, project path, repository ref, and token in the example app initialization form
  // and starts the Web IDE.
  await initForm.initWebIDE();

  // Asserts that the Web IDE is loaded and initialized with the project
  await workbench.waitForReady();
});

test('shows and accepts code suggestions', async () => {
  const fileName = 'test.js';
  const { fileContent: suggestions } = await getFixture('duo/codeSuggestions.json', 'json');
  const { fileContent: javascriptFileFixture } = await getFixture(
    'javascriptFileFixture.txt',
    'text',
  );

  await mockHttpRequest.mockCodeSuggestionsRequest(suggestions);

  // Create and open a JavaScript file
  await workbench.filesExplorer.createFile(fileName);

  await expect(workbench.filesExplorer.getItem(fileName)).toBeVisible();

  await workbench.filesExplorer.openFile(fileName);

  // Get the text editor for the file
  const textEditor = workbench.textEditor.getFileTextEditor(fileName);

  await textEditor.pressSequentially('\n\n', { delay: 10 });

  await textEditor.pressSequentially(javascriptFileFixture, { delay: 10 });

  // Start typing to trigger code suggestions
  await textEditor.pressSequentially('\n\nfunction add', { delay: 10 });

  await expect(textEditor).toHaveValue(/\s*function add/);

  // Assert that code suggestions appear
  await expect(workbench.webIdeFrame.getByText('(num1, num2) {', { exact: true })).toBeVisible({
    timeout: 10000,
  });

  // Accept the suggestion using Tab
  await textEditor.press('Tab');

  // Assert that the suggestion was inserted
  await expect(textEditor).toHaveValue(/\s*function add\(num1, num2\) {/);
});

test('shows and dismisses code suggestions', async () => {
  const fileName = 'test.js';
  const { fileContent: suggestions } = await getFixture('duo/codeSuggestions.json', 'json');
  const { fileContent: javascriptFileFixture } = await getFixture(
    'javascriptFileFixture.txt',
    'text',
  );

  await mockHttpRequest.mockCodeSuggestionsRequest(suggestions);

  await workbench.filesExplorer.createFile(fileName);

  await expect(workbench.filesExplorer.getItem(fileName)).toBeVisible({ timeout: 10000 });

  await workbench.filesExplorer.openFile(fileName);

  const textEditor = workbench.textEditor.getFileTextEditor(fileName);

  await textEditor.pressSequentially(javascriptFileFixture, { delay: 10 });

  await textEditor.pressSequentially('function add', { delay: 10 });

  await expect(textEditor).toHaveValue(/\s*function add/);

  // Assert that code suggestions appear
  await expect(workbench.webIdeFrame.getByText('(num1, num2) {', { exact: true })).toBeVisible({
    timeout: 10000,
  });

  await expect(async () => {
    // Cancel the suggestion using Escape
    await textEditor.press('Escape');

    // Assert that the suggestion was not inserted
    await expect(workbench.webIdeFrame.getByText('(num1, num2) {', { exact: true })).toBeHidden();
    await expect(textEditor).not.toHaveValue(/\s*function add\(num1, num2\) {/);
  }).toPass({ timeout: 20000 });
});

test.describe('code suggestions disabled', () => {
  test.beforeEach(async () => {
    await workbench.duoChatPanel.getChatPanel().waitFor({ state: 'visible' });

    await workbench.duoStatusBarIndicator.disableCodeSuggestions();

    await expect(
      workbench.webIdeFrame.getByRole('option', { name: 'Disable Code Suggestions' }),
    ).toBeHidden();
  });

  test('does not show suggestions when code suggestions is disabled', async () => {
    const fileName = 'test.js';
    const { fileContent: suggestions } = await getFixture('duo/codeSuggestions.json', 'json');

    await mockHttpRequest.mockRawFileRequest(fileName, '');

    await mockHttpRequest.mockCodeSuggestionsRequest(suggestions);

    await workbench.filesExplorer.createFile(fileName);

    await expect(workbench.filesExplorer.getItem(fileName)).toBeVisible();

    await workbench.filesExplorer.openFile(fileName);

    const textEditor = workbench.textEditor.getFileTextEditor(fileName);

    await textEditor.pressSequentially('function add', { delay: 10 });

    await expect(textEditor).toHaveValue(/\s*function add/);

    // Assert that code suggestions doesn't appear
    await expect(workbench.webIdeFrame.getByText('(num1, num2) {', { exact: true })).toBeHidden();
  });
});
