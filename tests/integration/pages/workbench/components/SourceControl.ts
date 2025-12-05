import { expect, type FrameLocator, type Locator } from '@playwright/test';

export class SourceControl {
  readonly #webIdeFrame: FrameLocator;

  #sourceControl: Locator;

  constructor(webIdeFrame: FrameLocator) {
    this.#webIdeFrame = webIdeFrame;
    this.#sourceControl = this.#webIdeFrame.getByRole('tree', {
      name: 'Source Control Management',
    });
  }

  async commitAndPushToNewBranch() {
    await expect(this.getPendingChangesIndicator()).toBeVisible();
    await this.#webIdeFrame.getByRole('tab', { name: 'Source Control' }).click();

    await this.#sourceControl.getByRole('button', { name: 'Commit and push to' }).click();
    await this.#webIdeFrame.getByRole('button', { name: 'Create new branch' }).click();
    await this.#webIdeFrame.getByRole('combobox', { name: 'input' }).press('Enter');
    await this.#webIdeFrame
      .getByRole('alert', { name: 'Your changes have been committed successfully.' })
      .isVisible();
  }

  async createMergeRequest() {
    await this.#webIdeFrame.getByRole('button', { name: 'Create MR' }).click();
  }

  getPendingChangesIndicator() {
    return this.#webIdeFrame.getByRole('tab', {
      name: /Source Control .* \d+ pending changes/,
    });
  }
}
