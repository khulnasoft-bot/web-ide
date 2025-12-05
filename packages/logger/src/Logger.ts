import type { LogWriter } from './types';
import { LogLevel } from './types';

export interface LoggerOptions {
  minLevel?: LogLevel;
  writer: LogWriter;
}

export class Logger {
  readonly #minLevel: LogLevel;

  readonly #writer: LogWriter;

  constructor(options: LoggerOptions) {
    this.#minLevel = options.minLevel === undefined ? LogLevel.Debug : options.minLevel;
    this.#writer = options.writer;
  }

  trace(...message: unknown[]): void {
    this.#writeLog(LogLevel.Trace, message);
  }

  debug(...message: unknown[]): void {
    this.#writeLog(LogLevel.Debug, message);
  }

  info(...message: unknown[]): void {
    this.#writeLog(LogLevel.Info, message);
  }

  warn(...message: unknown[]): void {
    this.#writeLog(LogLevel.Warn, message);
  }

  error(...message: unknown[]): void {
    this.#writeLog(LogLevel.Error, message);
  }

  #writeLog(level: LogLevel, message: unknown[]): void {
    if (level < this.#minLevel) {
      return;
    }

    this.#writer.log(level, ...message);
  }
}
