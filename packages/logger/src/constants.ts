import { LogLevel } from './types';

export const LOG_LEVEL_NAMES: Readonly<Record<LogLevel, string>> = {
  [LogLevel.Trace]: 'trace',
  [LogLevel.Debug]: 'debug',
  [LogLevel.Info]: 'info',
  [LogLevel.Warn]: 'warn',
  [LogLevel.Error]: 'error',
};
