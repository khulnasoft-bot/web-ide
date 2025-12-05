export enum LogLevel {
  Trace = 1,
  Debug = 2,
  Info = 3,
  Warn = 4,
  Error = 5,
}

export interface LogWriter {
  log(level: LogLevel, ...message: unknown[]): void;
}
