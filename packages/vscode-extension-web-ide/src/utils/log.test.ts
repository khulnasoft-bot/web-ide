import { LogLevel } from '@gitlab/logger';
import { log, setDefaultLogWriter } from './log';

describe('utils/log', () => {
  describe('log', () => {
    it('works before setDefaultLogWriter', () => {
      expect(() => log.info('hello')).not.toThrow();
    });

    it('uses the LogWriter set with setDefaultLogWriter', () => {
      const logWriter = {
        log: jest.fn(),
      };

      setDefaultLogWriter(logWriter);

      log.info('hello');
      log.error('world');

      expect(logWriter.log.mock.calls).toEqual([
        [LogLevel.Info, 'hello'],
        [LogLevel.Error, 'world'],
      ]);
    });
  });
});
