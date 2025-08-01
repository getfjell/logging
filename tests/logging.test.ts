import { getLogger } from '../src/logging';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
});
