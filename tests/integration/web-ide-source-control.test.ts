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

  // Fills in the KhulnaSoft URL, project path, repository ref, and token in the example app initialization form
  // and starts the Web IDE.
  await initForm.initWebIDE();

  await workbench.waitForReady();
});

test('opens a file in the Web IDE', async () => {
  const fileName = 'CONTRIBUTING.md';

  const { fileContent } = await getFixture('fileContent.txt', 'text');

  // Mocks a request to the KhulnaSoft API to return the file content.
  await mockHttpRequest.mockRawFileRequest(fileName, fileContent);

  // Opens the file in the files explorer.
  await workbench.filesExplorer.openFile(fileName).catch(e => {
    // eslint-disable-next-line no-console
    console.log(`Check your target project has ${fileName}`, e);
  });

  // Asserts that the file tab is visible in the text editor.
  await expect(workbench.textEditor.getFileTab(fileName)).toBeVisible();

  const textEditor = workbench.textEditor.getFileTextEditor(fileName);

  await textEditor.focus();

  // Asserts that the file content is displayed in the text editor.
  await expect(textEditor).toHaveValue(fileContent);
});

test('closing Web IDE shows an alert when there are unsaved changes', async ({ page }) => {
  await workbench.filesExplorer.createFile('test.ts');

  await expect(workbench.sourceControl.getPendingChangesIndicator()).toBeVisible();

  // Trigger the close action
  const dialogPromise = page.waitForEvent('dialog');
  await page.close({ runBeforeUnload: true });

  expect((await dialogPromise).type()).toBe('beforeunload');
});

test.describe('creates a file', () => {
  test('with existing file name', async () => {
    const fileName = 'test.ts';

    // Creates a file
    await workbench.filesExplorer.createFile(fileName);

    await expect(webIde.workbench.webIdeFrame.getByRole('tab', { name: 'test.ts' })).toBeVisible();

    // Creates another file with the same name
    await workbench.filesExplorer.createFile(fileName);

    // Asserts that an error message is displayed
    await expect(
      webIde.workbench.webIdeFrame.getByText(
        `A file or folder ${fileName} already exists at this location`,
      ),
    ).toBeVisible();
  });

  test('with existing folder name', async ({ page }) => {
    const folderName = 'testFolder';

    // Creates a folder
    await workbench.filesExplorer.createFolder(folderName);

    await expect(workbench.filesExplorer.getItem(folderName)).toBeVisible();
    // Presses Escape key to reset selected location to prevent nesting the new folder within the previously created directory
    await page.keyboard.press('Escape');

    // Creates another folder with the same name
    await workbench.filesExplorer.createFolder(folderName);

    // Asserts that an error message is displayed
    await expect(
      webIde.workbench.webIdeFrame.getByText(
        `A file or folder ${folderName} already exists at this location`,
      ),
    ).toBeVisible();
  });
});

test.describe('uploads a file', () => {
  const folderName = 'testFolder';

  test.skip(
    ({ browserName }) => browserName === 'firefox',
    'File upload test does not work in Firefox in the test environment',
  );

  test.beforeEach(async () => {
    await workbench.filesExplorer.createFolder(folderName);
    await mockHttpRequest.mockCommitRequest();
  });

  test('text', async ({ page, browser, browserName }) => {
    test.skip(browserName !== 'chromium');

    const { filePath } = await getFixture('fileContent.txt', 'text');
    await workbench.filesExplorer.uploadFileToFolder({ filePath, page, folderName });

    await workbench.sourceControl.commitAndPushToNewBranch();

    // Asserts that the file is committed successfully
    await expect(
      webIde.workbench.webIdeFrame.getByText('Your changes have been committed successfully.'),
    ).toBeVisible();

    const context = browser.contexts()[0];

    const requestUrls: string[] = [];

    // Collects a list of requests fired from current browser session
    context.on('request', async r => {
      requestUrls.push(r.url());
    });

    const createMRPagePromise = page.waitForEvent('popup');
    await workbench.sourceControl.createMergeRequest();
    await createMRPagePromise;

    const createMRPageUrl = requestUrls.find(url => {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;

      return (
        urlObj.pathname.includes('/-/merge_requests/new') &&
        params.get('nav_source') === 'webide' &&
        params.has('merge_request[source_branch]') &&
        params.has('merge_request[target_branch]') &&
        params.has('merge_request[target_branch]')
      );
    });

    expect(createMRPageUrl).toBeTruthy();
  });

  test('image', async ({ page }) => {
    const { filePath } = await getFixture('dk.png', 'image');

    await workbench.filesExplorer.uploadFileToFolder({ filePath, page, folderName });

    await workbench.sourceControl.commitAndPushToNewBranch();

    // Asserts that the file is committed successfully
    await expect(
      webIde.workbench.webIdeFrame.getByText('Your changes have been committed successfully.'),
    ).toBeVisible();
  });

  test('with existing file name', async ({ page }) => {
    const fileName = 'fileContent.txt';

    await workbench.filesExplorer.selectExplorerItem(folderName);

    // Creates a file
    await workbench.filesExplorer.createFile(fileName);

    await expect(workbench.filesExplorer.getItem(fileName)).toBeVisible();

    // Presses Escape key to reset selected location to prevent nesting the new folder within the previously created directory
    await page.keyboard.press('Escape');

    const { filePath } = await getFixture(fileName, 'text');

    await workbench.filesExplorer.uploadFileToFolder({ filePath, page, folderName });

    // Asserts that an error message is displayed
    await expect(
      webIde.workbench.webIdeFrame.getByRole('dialog', {
        name: `A file or folder with the name '${fileName}' already exists in the destination folder`,
      }),
    ).toBeVisible();
  });
});
