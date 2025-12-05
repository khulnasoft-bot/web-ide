import type { FrameLocator, Locator } from '@playwright/test';

export class ExplorerHeader {
  readonly #webIdeFrame: FrameLocator;

  readonly #explorerHeader: Locator;

  constructor(webIdeFrame: FrameLocator) {
    this.#webIdeFrame = webIdeFrame;
    this.#explorerHeader = this.#webIdeFrame.getByRole('button', { name: 'Explorer Section' });
  }

  async clickActionItem(label: string) {
    await this.#explorerHeader.focus();

    await this.#explorerHeader.getByRole('button', { name: label }).click();
  }
}
