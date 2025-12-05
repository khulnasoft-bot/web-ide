import { ConsoleLogWriter } from './ConsoleLogWriter';
import { LogLevel } from './types';

const TEST_MESSAGE = ['Hello', new Error('Boom!')];

describe('ConsoleLogWriter', () => {
  let consoleSpy: jest.Mock<void, [string, unknown[]]>;

  beforeEach(() => {
    consoleSpy = jest.fn();

    (['trace', 'debug', 'info', 'warn', 'error', 'log'] as const).forEach(x => {
      jest.spyOn(console, x).mockImplementation((...args) => consoleSpy(x, args));
    });
  });

  it.each`
    logLevel          | method
    ${LogLevel.Trace} | ${'trace'}
    ${LogLevel.Debug} | ${'debug'}
    ${LogLevel.Info}  | ${'info'}
    ${LogLevel.Warn}  | ${'warn'}
    ${LogLevel.Error} | ${'error'}
  `('with level=$logLevel, should call console.$method', ({ logLevel, method }) => {
    const writer = new ConsoleLogWriter();

    expect(consoleSpy).not.toHaveBeenCalled();

    writer.log(logLevel, ...TEST_MESSAGE);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(method, TEST_MESSAGE);
  });
});
