import type { FrameLocator, Locator } from '@playwright/test';

export class DuoStatusBarIndicator {
  readonly #webIdeFrame: FrameLocator;

  readonly duoStatusBarIndicator: Locator;

  constructor(webIdeFrame: FrameLocator) {
    this.#webIdeFrame = webIdeFrame;
    this.duoStatusBarIndicator = this.#webIdeFrame.getByRole('button', {
      name: 'gitlab-code-suggestions',
    });
  }

  async openDuoStatusMenu() {
    await this.duoStatusBarIndicator.click();

    await this.#webIdeFrame
      .getByRole('listbox', { name: 'Type to narrow down results.' })
      .waitFor({ state: 'visible', timeout: 5000 });
  }

  async closeDuoStatusMenu() {
    await this.#webIdeFrame.owner().press('Escape');

    await this.#webIdeFrame
      .getByRole('listbox', { name: 'Type to narrow down results.' })
      .waitFor({ state: 'hidden', timeout: 5000 });
  }

  async clickOption(optionName: string) {
    const menuOption = this.#webIdeFrame.getByRole('option', { name: optionName });
    await menuOption.click();
  }

  async enableCodeSuggestions() {
    await this.openDuoStatusMenu();

    const enableOption = this.#webIdeFrame.getByRole('option', { name: 'Enable Code Suggestions' });

    if (await enableOption.isVisible()) {
      await this.clickOption('Enable Code Suggestions');
    }

    await this.closeDuoStatusMenu();
  }

  async disableCodeSuggestions() {
    await this.openDuoStatusMenu();

    const disableOption = this.#webIdeFrame.getByRole('option', {
      name: 'Disable Code Suggestions',
    });

    if (await disableOption.isVisible()) {
      await this.clickOption('Disable Code Suggestions');
    }

    await this.closeDuoStatusMenu();
  }
}
