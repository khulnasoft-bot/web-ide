import type * as vscode from 'vscode';
import type { LogLevel, LogWriter } from '@gitlab/logger';
import { LOG_LEVEL_NAMES } from '@gitlab/logger';

const PADDING = 4;
const padNextLines = (text: string) => text.replace(/\n/g, `\n${' '.repeat(PADDING)}`);

export class OutputChannelLogWriter implements LogWriter {
  readonly #outputChannel: vscode.OutputChannel;

  constructor(outputChannel: vscode.OutputChannel) {
    this.#outputChannel = outputChannel;
  }

  log(level: LogLevel, ...message: unknown[]): void {
    const levelName = LOG_LEVEL_NAMES[level];
    const timestamp = new Date().toISOString();

    this.#outputChannel.appendLine(`${timestamp} [${levelName}] ${padNextLines(message.join(''))}`);
  }
}
