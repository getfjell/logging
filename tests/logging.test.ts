import { getLogger } from '../src/logging';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Logging', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      LOG_LEVEL: '',
      LOGGING_CONFIG: '',
      EXPO_PUBLIC_LOGGING_CONFIG: '',
      NEXT_PUBLIC_LOGGING_CONFIG: '',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should log messages according to log level', () => {
    process.env.LOG_LEVEL = 'DEBUG';

    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();

    const logger = getLogger('testCategory');

    logger.error('Error message');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));

    logger.warning('Warning message');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[WARNING]'));

    logger.info('Info message');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));

    logger.notice('Notice message');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[NOTICE]'));

    logger.debug('Debug message');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
  });

  it('should handle timer logs correctly', () => {
    process.env.LOG_LEVEL = 'DEBUG';
    const logger = getLogger('testCategory');

    console.time = vi.fn();
    console.timeEnd = vi.fn();
    console.timeLog = vi.fn();

    const timer = logger.time('Timer message');
    timer.log('Intermediate log');
    timer.end();

    expect(console.time).toHaveBeenCalled();
    expect(console.timeLog).toHaveBeenCalledWith(expect.any(String), 'Intermediate log');
    expect(console.timeEnd).toHaveBeenCalled();
  });

  it('should allow adding more components with get method', () => {
    process.env.LOG_LEVEL = 'DEBUG';

    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();

    const logger = getLogger('testCategory');
    const logger2 = logger.get('testCategory', 'component1');
    const extendedLogger = logger2.get('component2');
    extendedLogger.error('Error message');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[testCategory]'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[component1]'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[component2]'));

    extendedLogger.warning('Warn message');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[WARNING]'));
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[testCategory]'));
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[component1]'));
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[component2]'));

    extendedLogger.info('Info message');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[testCategory]'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[component1]'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[component2]'));

    extendedLogger.debug('Debug message');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[testCategory]'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[component1]'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[component2]'));
  });

  it('should handle nested loggers with timers correctly', () => {
    process.env.LOG_LEVEL = 'DEBUG';
    const logger = getLogger('testCategory');

    const logger2 = logger.get('testCategory', 'component1');
    const extendedLogger = logger2.get('component2');

    console.time = vi.fn();
    console.timeEnd = vi.fn();
    console.timeLog = vi.fn();

    const timer = extendedLogger.time('Nested timer message');
    timer.log('Intermediate log');
    timer.end();

    expect(console.time).toHaveBeenCalled();
    expect(console.timeLog).toHaveBeenCalledWith(expect.any(String), 'Intermediate log');
    expect(console.timeEnd).toHaveBeenCalled();
  });

  it('should handle logging with undefined payload data', () => {
    process.env.LOG_LEVEL = 'DEBUG';

    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();

    const logger = getLogger('testCategory');

    logger.error('Error message');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error message'));

    logger.warning('Warn message');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[WARNING]'));
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Warn message'));

    logger.info('Info message');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Info message'));

    logger.debug('Debug message');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Debug message'));

    console.time = vi.fn();
    console.timeEnd = vi.fn();
    console.timeLog = vi.fn();

    const timer = logger.time('timer message');
    timer.log('log');
    timer.end();

    expect(console.time).toHaveBeenCalled();
    expect(console.timeLog).toHaveBeenCalledWith(expect.any(String), 'log');
    expect(console.timeEnd).toHaveBeenCalled();
  });

  it('should log emergency, alert, critical and default messages correctly', () => {
    process.env.LOG_LEVEL = 'DEFAULT';
    const logger = getLogger('testCategory');

    logger.emergency('Emergency message');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[EMERGENCY]'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Emergency message'));

    logger.alert('Alert message');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[ALERT]'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Alert message'));

    logger.critical('Critical message');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[CRITICAL]'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Critical message'));

    logger.trace('Trace message');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[TRACE]'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Trace message'));

    logger.default('Default message');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[DEFAULT]'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Default message'));
  });

  // New tests to increase coverage
  describe('Logger Override Logic', () => {
    it('should apply log level overrides when configured', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          'testCategory': {
            logLevel: 'DEBUG'
          }
        }
      });

      console.log = vi.fn();
      console.error = vi.fn();
      console.warn = vi.fn();

      const logger = getLogger('testCategory');

      // Should log debug messages due to override
      logger.debug('Debug message with override');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
    });

    it('should not apply overrides when category name does not match', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          'differentCategory': {
            logLevel: 'DEBUG'
          }
        }
      });

      console.log = vi.fn();
      console.error = vi.fn();
      console.warn = vi.fn();

      const logger = getLogger('testCategory');

      // Should not log debug messages due to no override
      logger.debug('Debug message without override');
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should handle empty overrides object', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {}
      });

      console.log = vi.fn();
      console.error = vi.fn();
      console.warn = vi.fn();

      const logger = getLogger('testCategory');

      // Should not log debug messages due to no override
      logger.debug('Debug message with empty overrides');
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should handle undefined overrides', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO'
        // No overrides property
      });

      console.log = vi.fn();
      console.error = vi.fn();
      console.warn = vi.fn();

      const logger = getLogger('testCategory');

      // Should not log debug messages due to no override
      logger.debug('Debug message with undefined overrides');
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should handle null overrides', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: null
      });

      console.log = vi.fn();
      console.error = vi.fn();
      console.warn = vi.fn();

      const logger = getLogger('testCategory');

      // Should not log debug messages due to no override
      logger.debug('Debug message with null overrides');
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('Logger Component Handling', () => {
    it('should create logger with empty components array by default', () => {
      process.env.LOG_LEVEL = 'DEBUG';

      console.log = vi.fn();
      const logger = getLogger('testCategory');

      logger.info('Test message');

      // Verify the logger was created with correct coordinates
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[testCategory]'));
    });

    it('should handle logger with multiple components', () => {
      process.env.LOG_LEVEL = 'DEBUG';

      console.log = vi.fn();
      const logger = getLogger('testCategory');
      const componentLogger = logger.get('component1', 'component2');

      componentLogger.info('Test message');

      // Verify components are included in the log output
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[testCategory]'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[component1]'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[component2]'));
    });

    it('should handle logger with no additional components', () => {
      process.env.LOG_LEVEL = 'DEBUG';

      console.log = vi.fn();
      const logger = getLogger('testCategory');
      const noComponentLogger = logger.get();

      noComponentLogger.info('Test message');

      // Verify no additional components are added
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[testCategory]'));
    });
  });

  describe('Logger Method Coverage', () => {
    it('should call all logging methods correctly', () => {
      process.env.LOG_LEVEL = 'DEFAULT';

      console.log = vi.fn();
      console.error = vi.fn();
      console.warn = vi.fn();

      const logger = getLogger('testCategory');

      // Test all logging methods
      logger.emergency('Emergency test');
      logger.alert('Alert test');
      logger.critical('Critical test');
      logger.error('Error test');
      logger.warning('Warning test');
      logger.notice('Notice test');
      logger.info('Info test');
      logger.debug('Debug test');
      logger.trace('Trace test');
      logger.default('Default test');

      expect(console.error).toHaveBeenCalledTimes(4); // emergency, alert, critical, error
      expect(console.warn).toHaveBeenCalledTimes(1);  // warning
      expect(console.log).toHaveBeenCalledTimes(5);   // notice, info, debug, trace, default
    });

    it('should handle timer methods correctly', () => {
      process.env.LOG_LEVEL = 'DEBUG';

      console.time = vi.fn();
      console.timeEnd = vi.fn();
      console.timeLog = vi.fn();

      const logger = getLogger('testCategory');
      const timer = logger.time('Test timer');

      timer.log('Intermediate log');
      timer.end();

      expect(console.time).toHaveBeenCalledTimes(1);
      expect(console.timeLog).toHaveBeenCalledTimes(1);
      expect(console.timeEnd).toHaveBeenCalledTimes(1);
    });

    it('should handle timer methods when log level is below DEBUG', () => {
      process.env.LOG_LEVEL = 'INFO';

      console.time = vi.fn();
      console.timeEnd = vi.fn();
      console.timeLog = vi.fn();

      const logger = getLogger('testCategory');
      const timer = logger.time('Test timer');

      timer.log('Intermediate log');
      timer.end();

      // Should not call console methods when log level is below DEBUG
      expect(console.time).not.toHaveBeenCalled();
      expect(console.timeLog).not.toHaveBeenCalled();
      expect(console.timeEnd).not.toHaveBeenCalled();
    });
  });
});
