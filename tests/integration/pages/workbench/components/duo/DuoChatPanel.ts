import type { FrameLocator, Locator } from '@playwright/test';

export class DuoChatPanel {
  readonly #webIdeFrame: FrameLocator;

  readonly #duoChatPanel: Locator;

  readonly duoChatFrame: FrameLocator;

  constructor(webIdeFrame: FrameLocator) {
    this.#webIdeFrame = webIdeFrame;
    this.#duoChatPanel = this.#webIdeFrame.getByRole('tab', { name: 'GitLab Duo Chat' });
    this.duoChatFrame = this.#webIdeFrame
      .locator('iframe.webview.ready[src*="GitLab.gitlab-workflow"]')
      .contentFrame()
      .locator('#active-frame')
      .contentFrame();
  }

  getChatPanel() {
    return this.#duoChatPanel;
  }

  getChatPanelHeader() {
    return this.#webIdeFrame.getByRole('heading', { name: 'GitLab Duo Chat' });
  }

  getChatPromptInput() {
    return this.duoChatFrame.getByTestId('chat-prompt-input');
  }

  getChatHistory() {
    return this.duoChatFrame.getByTestId('chat-history');
  }

  async clearChat() {
    await this.sendChatPrompt('/clear');
  }

  async resetChat() {
    await this.sendChatPrompt('/reset');
  }

  async openDuoChatPanel() {
    await this.#duoChatPanel.click();
  }

  async fillInputPrompt(prompt: string) {
    await this.duoChatFrame.getByTestId('chat-prompt-input').fill(prompt);
  }

  async sendChatPrompt(prompt: string) {
    await this.fillInputPrompt(prompt);

    await this.duoChatFrame.getByTestId('chat-prompt-submit-button').click();
  }
}
