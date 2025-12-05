import { createConsoleLogger } from './factory';
import { Logger } from './Logger';
import { LogLevel } from './types';

const TEST_MESSAGE = ['Hello', new Error('BOOM!')];

describe('factory', () => {
  describe('createConsoleLogger', () => {
    it('creates logger that writes to console', () => {
      const consoleSpy = jest.fn();
      jest.spyOn(console, 'warn').mockImplementation((...args) => consoleSpy('warn', args));
      jest.spyOn(console, 'debug').mockImplementation((...args) => consoleSpy('debug', args));
      jest.spyOn(console, 'error').mockImplementation((...args) => consoleSpy('error', args));

      const logger = createConsoleLogger({ minLevel: LogLevel.Error });

      expect(logger).toBeInstanceOf(Logger);
      expect(consoleSpy).not.toHaveBeenCalled();

      logger.warn(...TEST_MESSAGE);
      logger.debug(...TEST_MESSAGE);
      logger.error(...TEST_MESSAGE);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('error', TEST_MESSAGE);
    });
  });
});
