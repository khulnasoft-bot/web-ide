import type { FrameLocator, Locator, Page } from '@playwright/test';
import { FilesExplorer } from './components/FilesExplorer';
import { TextEditor } from './components/TextEditor';
import { SourceControl } from './components/SourceControl';
import { DuoChatPanel } from './components/duo/DuoChatPanel';
import { DuoStatusBarIndicator } from './components/duo/DuoStatusBarIndicator';

export const WEB_IDE_FRAME_TEST_ID = 'web-ide-iframe';

interface WebIDEConstructionOptions {
  page: Page;
}

export class Workbench {
  readonly #page: Page;

  readonly webIdeFrame: FrameLocator;

  readonly filesExplorer: FilesExplorer;

  readonly textEditor: TextEditor;

  readonly sourceControl: SourceControl;

  readonly duoChatPanel: DuoChatPanel;

  readonly duoStatusBarIndicator: DuoStatusBarIndicator;

  constructor({ page }: WebIDEConstructionOptions) {
    this.#page = page;
    this.webIdeFrame = this.#page.getByTestId(WEB_IDE_FRAME_TEST_ID).contentFrame();
    this.filesExplorer = new FilesExplorer(this.webIdeFrame);
    this.textEditor = new TextEditor(this.webIdeFrame);
    this.sourceControl = new SourceControl(this.webIdeFrame);
    this.duoChatPanel = new DuoChatPanel(this.webIdeFrame);
    this.duoStatusBarIndicator = new DuoStatusBarIndicator(this.webIdeFrame);
  }

  async clickTab(tabName: string) {
    await this.webIdeFrame.getByRole('tab', { name: tabName }).click();
  }

  getMenu(): Locator {
    return this.webIdeFrame.getByRole('menu');
  }

  async waitForReady() {
    await this.webIdeFrame.getByRole('dialog', { name: 'Initializing KhulnaSoft Web IDE...' }).waitFor({
      state: 'visible',
    });
    await this.filesExplorer.getFirstItem().waitFor({ state: 'visible' });
    await this.webIdeFrame.getByRole('dialog', { name: 'Initializing KhulnaSoft Web IDE...' }).waitFor({
      state: 'hidden',
    });
  }
}
