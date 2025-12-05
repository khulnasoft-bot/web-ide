import type { LogLevel, LogWriter } from '@gitlab/logger';
import { Logger } from '@gitlab/logger';

let defaultLogWriter: LogWriter | undefined;

/**
 * This sets up the default `LogWriter` that is used by `log`.
 *
 * `log` has a closure reference to the default `LogWriter`, so if `setDefaultLogWriter`
 * is called at anytime, this will change the behavior of the `log` singleton.
 */
export const setDefaultLogWriter = (logWriter: LogWriter) => {
  defaultLogWriter = logWriter;
};

/**
 * The default `Logger` that should be used across the extension.
 *
 * This contains a reference to the default `LogWriter` that is setup with `setDefaultLogWriter`.
 */
export const log = new Logger({
  writer: {
    log(level: LogLevel, ...message: string[]) {
      defaultLogWriter?.log(level, ...message);
    },
  },
});
