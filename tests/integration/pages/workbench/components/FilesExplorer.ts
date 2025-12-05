import type { FrameLocator, Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { ExplorerHeader } from './ExplorerHeader';

export class FilesExplorer {
  readonly #webIdeFrame: FrameLocator;

  readonly #filesExplorer: Locator;

  readonly #header: ExplorerHeader;

  constructor(webIdeFrame: FrameLocator) {
    this.#webIdeFrame = webIdeFrame;
    this.#filesExplorer = this.#webIdeFrame.getByRole('tree', { name: 'Files Explorer' });
    this.#header = new ExplorerHeader(webIdeFrame);
  }

  /**
   * Opens a file in the files explorer. The file must be visible in the file
   * explorer.
   * @param fileName - The name of the file to open.
   */
  async openFile(fileName: string): Promise<void> {
    await this.#filesExplorer.getByRole('treeitem', { name: fileName }).click();
  }

  /**
   * Gets an item in the files explorer.
   * @param label - The name of the file or folder to get the item for.
   * @returns Locator
   */
  getItem(label: string): Locator {
    return this.#filesExplorer.getByRole('treeitem', { name: label });
  }

  /**
   * Gets the first item in the files explorer
   * @returns Locator
   */
  getFirstItem(): Locator {
    return this.#filesExplorer.getByRole('treeitem').first();
  }

  /**
   * Creates a file in the files explorer.
   * @param name The name of the file to create.
   * @returns Locator
   */
  async createFile(name: string): Promise<void> {
    await this.#header.clickActionItem('New File...');
    const input = this.#filesExplorer.getByRole('textbox', { name: 'Type file name' });
    await input.fill(name);
    await input.press('Enter');
  }

  /**
   * Creates a folder in the files explorer.
   * @param name The name of the folder to create.
   */
  async createFolder(name: string): Promise<void> {
    await this.#header.clickActionItem('New Folder...');

    // aria-label for folder name input element starts with "Type file name" instead of "Type folder name" in VSCode
    const input = this.#filesExplorer.getByRole('textbox', { name: 'Type file name' });
    await input.fill(name);
    await input.press('Enter');
  }

  /**
   * Opens the context menu for a specific explorer item.
   * @param name The name of the item to open the context menu for.
   */
  async openExplorerItemContextMenu(name: string) {
    await this.#filesExplorer.getByRole('treeitem', { name }).click({ button: 'right' });
  }

  /**
   * Selects the item in the files explorer.
   * @param name - The name of the item to select.
   */
  async selectExplorerItem(name: string) {
    await this.#filesExplorer.getByRole('treeitem', { name }).click({ button: 'left' });
  }

  /**
   * Uploads a file
   * @param filePath
   * @param page
   * @param uploadLocation
   */

  /**
   * Uploads a file to the specified folder in the files explorer.
   * @param params.filePath - The path to the file to upload
   * @param params.page - The page instance
   * @param params.folderName - The name of the folder to upload a file to. The folder must be visible in the files explorer.
   */
  async uploadFileToFolder({
    filePath,
    page,
    folderName,
  }: {
    filePath: string;
    page: Page;
    folderName: string;
  }) {
    // Open menu
    await this.openExplorerItemContextMenu(folderName);
    const menu = this.#webIdeFrame.getByRole('menu');
    await expect(menu).toBeVisible();

    // Wait for the upload menu item to be visible
    const uploadMenuItem = menu.getByLabel('Upload...');
    await expect(uploadMenuItem).toBeVisible();

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      menu.getByLabel('Upload...').click({ delay: 500 }),
    ]);

    await fileChooser.setFiles(filePath);
  }
}
