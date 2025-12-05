import type { LoggerOptions } from './Logger';
import { Logger } from './Logger';
import { ConsoleLogWriter } from './ConsoleLogWriter';

type ConsoleLoggerOptions = Omit<LoggerOptions, 'writer'>;

export const createConsoleLogger = (options: ConsoleLoggerOptions = {}) =>
  new Logger({
    ...options,
    writer: new ConsoleLogWriter(),
  });

export const defaultLogger = createConsoleLogger();
