import type { FrameLocator, Locator } from '@playwright/test';

export class TextEditor {
  readonly #webIdeFrame: FrameLocator;

  constructor(webIdeFrame: FrameLocator) {
    this.#webIdeFrame = webIdeFrame;
  }

  /**
   * Gets the tab of a file that is open in the text editor.
   * @param fileName - The name of the file to get the tab for.
   */
  getFileTab(fileName: string): Locator {
    return this.#webIdeFrame.getByRole('tab', { name: fileName });
  }

  /**
   * Gets the text editor of a file that is open in the text editor.
   * @param fileName - The name of the file to get the text editor for.
   */
  getFileTextEditor(fileName: string): Locator {
    return this.#webIdeFrame.getByRole('textbox', { name: fileName });
  }
}
