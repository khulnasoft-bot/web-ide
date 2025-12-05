/* eslint-disable no-console */
import type { LogWriter } from './types';
import { LogLevel } from './types';

export class ConsoleLogWriter implements LogWriter {
  // eslint-disable-next-line class-methods-use-this
  log(level: LogLevel, ...message: unknown[]): void {
    switch (level) {
      case LogLevel.Trace:
        console.trace(...message);
        break;
      case LogLevel.Debug:
        console.debug(...message);
        break;
      case LogLevel.Info:
        console.info(...message);
        break;
      case LogLevel.Warn:
        console.warn(...message);
        break;
      case LogLevel.Error:
        console.error(...message);
        break;
      default:
        console.log(...message);
        break;
    }
  }
}
