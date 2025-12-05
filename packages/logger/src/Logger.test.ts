import type { LogWriter } from './types';
import { LogLevel } from './types';
import { Logger } from './Logger';

const TEST_MESSAGE = ['Hello', new Error('BOOM!')];

describe('Logger', () => {
  let spyWriter: LogWriter;

  beforeEach(() => {
    spyWriter = {
      log: jest.fn(),
    };
  });

  it.each`
    minLogLevel       | method     | expectedCalls
    ${LogLevel.Debug} | ${'trace'} | ${[]}
    ${LogLevel.Debug} | ${'debug'} | ${[[LogLevel.Debug, ...TEST_MESSAGE]]}
    ${LogLevel.Debug} | ${'info'}  | ${[[LogLevel.Info, ...TEST_MESSAGE]]}
    ${LogLevel.Debug} | ${'warn'}  | ${[[LogLevel.Warn, ...TEST_MESSAGE]]}
    ${LogLevel.Debug} | ${'error'} | ${[[LogLevel.Error, ...TEST_MESSAGE]]}
    ${LogLevel.Info}  | ${'trace'} | ${[]}
    ${LogLevel.Info}  | ${'debug'} | ${[]}
    ${LogLevel.Info}  | ${'info'}  | ${[[LogLevel.Info, ...TEST_MESSAGE]]}
    ${LogLevel.Info}  | ${'warn'}  | ${[[LogLevel.Warn, ...TEST_MESSAGE]]}
    ${LogLevel.Info}  | ${'error'} | ${[[LogLevel.Error, ...TEST_MESSAGE]]}
    ${LogLevel.Warn}  | ${'trace'} | ${[]}
    ${LogLevel.Warn}  | ${'debug'} | ${[]}
    ${LogLevel.Warn}  | ${'info'}  | ${[]}
    ${LogLevel.Warn}  | ${'warn'}  | ${[[LogLevel.Warn, ...TEST_MESSAGE]]}
    ${LogLevel.Warn}  | ${'error'} | ${[[LogLevel.Error, ...TEST_MESSAGE]]}
    ${LogLevel.Error} | ${'trace'} | ${[]}
    ${LogLevel.Error} | ${'debug'} | ${[]}
    ${LogLevel.Error} | ${'info'}  | ${[]}
    ${LogLevel.Error} | ${'warn'}  | ${[]}
    ${LogLevel.Error} | ${'error'} | ${[[LogLevel.Error, ...TEST_MESSAGE]]}
  `(
    'with minLogLevel=$minLogLevel, calling $method should have $expectedCalls.length',
    ({
      minLogLevel,
      method,
      expectedCalls,
    }: {
      minLogLevel: LogLevel;
      method: keyof Logger;
      expectedCalls: unknown;
    }) => {
      const logger = new Logger({ minLevel: minLogLevel, writer: spyWriter });

      expect(spyWriter.log).not.toHaveBeenCalled();

      logger[method](...TEST_MESSAGE);

      expect(jest.mocked(spyWriter.log).mock.calls).toEqual(expectedCalls);
    },
  );
});
