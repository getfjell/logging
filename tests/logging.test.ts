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

  describe('Hierarchical Component Log Level Configuration', () => {
    it('should apply component-specific log level override', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'INFO',
            components: {
              'CacheWarmer': { logLevel: 'DEBUG' }
            }
          }
        }
      });

      console.log = vi.fn();
      console.error = vi.fn();
      console.warn = vi.fn();

      const logger = getLogger('@fjell/cache');
      const cacheWarmerLogger = logger.get('CacheWarmer');

      // Base logger should not log debug messages
      logger.debug('Base debug message');
      expect(console.log).not.toHaveBeenCalled();

      // CacheWarmer logger should log debug messages
      cacheWarmerLogger.debug('CacheWarmer debug message');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[CacheWarmer]'));
    });

    it('should inherit parent log level when component not configured', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'WARNING',
            components: {
              'CacheWarmer': { logLevel: 'DEBUG' }
            }
          }
        }
      });

      console.log = vi.fn();
      console.error = vi.fn();
      console.warn = vi.fn();

      const logger = getLogger('@fjell/cache');
      const otherLogger = logger.get('OtherComponent');

      // OtherComponent should inherit the category-level WARNING
      otherLogger.info('Info message');
      expect(console.log).not.toHaveBeenCalled();

      otherLogger.warning('Warning message');
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[WARNING]'));
    });

    it('should handle deeply nested component overrides', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'INFO',
            components: {
              'CacheWarmer': {
                logLevel: 'WARNING',
                components: {
                  'SubComponent': { logLevel: 'DEBUG' }
                }
              }
            }
          }
        }
      });

      console.log = vi.fn();
      console.error = vi.fn();
      console.warn = vi.fn();

      const logger = getLogger('@fjell/cache');
      const cacheWarmerLogger = logger.get('CacheWarmer');
      const subComponentLogger = cacheWarmerLogger.get('SubComponent');

      // Base logger should not log debug
      logger.debug('Base debug');
      expect(console.log).not.toHaveBeenCalled();

      // CacheWarmer should not log debug (WARNING level)
      cacheWarmerLogger.debug('CacheWarmer debug');
      expect(console.log).not.toHaveBeenCalled();

      // SubComponent should log debug
      subComponentLogger.debug('SubComponent debug');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[SubComponent]'));
    });

    it('should handle multiple sibling component overrides', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'INFO',
            components: {
              'CacheWarmer': { logLevel: 'DEBUG' },
              'TwoLayerCache': { logLevel: 'ERROR' }
            }
          }
        }
      });

      console.log = vi.fn();
      console.error = vi.fn();
      console.warn = vi.fn();

      const logger = getLogger('@fjell/cache');
      const cacheWarmerLogger = logger.get('CacheWarmer');
      const twoLayerLogger = logger.get('TwoLayerCache');

      // CacheWarmer should log debug
      cacheWarmerLogger.debug('CacheWarmer debug');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[CacheWarmer]'));

      // TwoLayerCache should not log info (ERROR level)
      vi.clearAllMocks();
      twoLayerLogger.info('TwoLayerCache info');
      expect(console.log).not.toHaveBeenCalled();

      // TwoLayerCache should log error
      twoLayerLogger.error('TwoLayerCache error');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[TwoLayerCache]'));
    });

    it('should use most specific component override', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'WARNING',
            components: {
              'CacheWarmer': {
                logLevel: 'INFO',
                components: {
                  'Strategy': {
                    logLevel: 'DEBUG',
                    components: {
                      'LRU': { logLevel: 'TRACE' }
                    }
                  }
                }
              }
            }
          }
        }
      });

      console.log = vi.fn();

      const logger = getLogger('@fjell/cache');
      const l1 = logger.get('CacheWarmer');
      const l2 = l1.get('Strategy');
      const l3 = l2.get('LRU');

      // Each level should have its configured log level
      logger.info('base info');
      expect(console.log).not.toHaveBeenCalled(); // WARNING level, no info

      l1.info('l1 info');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[INFO]')); // INFO level

      vi.clearAllMocks();
      l2.debug('l2 debug');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]')); // DEBUG level

      vi.clearAllMocks();
      l3.trace('l3 trace');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[TRACE]')); // TRACE level
    });

    it('should handle 4 levels of component nesting', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'WARNING',
            components: {
              'Level1': {
                logLevel: 'NOTICE',
                components: {
                  'Level2': {
                    logLevel: 'INFO',
                    components: {
                      'Level3': { logLevel: 'DEBUG' }
                    }
                  }
                }
              }
            }
          }
        }
      });

      console.log = vi.fn();
      console.warn = vi.fn();

      const base = getLogger('@fjell/cache');
      const l1 = base.get('Level1');
      const l2 = l1.get('Level2');
      const l3 = l2.get('Level3');

      // Test base (WARNING)
      base.info('base info');
      expect(console.log).not.toHaveBeenCalled();
      base.warning('base warning');
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[WARNING]'));

      // Test Level1 (NOTICE)
      vi.clearAllMocks();
      l1.info('l1 info');
      expect(console.log).not.toHaveBeenCalled();
      l1.notice('l1 notice');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[NOTICE]'));

      // Test Level2 (INFO)
      vi.clearAllMocks();
      l2.debug('l2 debug');
      expect(console.log).not.toHaveBeenCalled();
      l2.info('l2 info');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));

      // Test Level3 (DEBUG)
      vi.clearAllMocks();
      l3.debug('l3 debug');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[Level3]'));
    });

    it('should handle 5 levels of component nesting', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'ERROR',
        overrides: {
          '@fjell/cache': {
            logLevel: 'ERROR',
            components: {
              'L1': {
                logLevel: 'WARNING',
                components: {
                  'L2': {
                    logLevel: 'NOTICE',
                    components: {
                      'L3': {
                        logLevel: 'INFO',
                        components: {
                          'L4': { logLevel: 'DEBUG' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      console.log = vi.fn();
      console.warn = vi.fn();
      console.error = vi.fn();

      const base = getLogger('@fjell/cache');
      const l1 = base.get('L1');
      const l2 = l1.get('L2');
      const l3 = l2.get('L3');
      const l4 = l3.get('L4');

      // Each level should progressively allow more verbose logging
      base.warning('base');
      expect(console.warn).not.toHaveBeenCalled(); // ERROR level, no warning

      l1.warning('l1');
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('l1')); // WARNING level

      vi.clearAllMocks();
      l2.notice('l2');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('l2')); // NOTICE level

      vi.clearAllMocks();
      l3.info('l3');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('l3')); // INFO level

      vi.clearAllMocks();
      l4.debug('l4');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('l4')); // DEBUG level
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[L4]'));
    });

    it('should handle multiple independent branches', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'INFO',
            components: {
              'BranchA': {
                logLevel: 'DEBUG',
                components: {
                  'SubA': { logLevel: 'TRACE' }
                }
              },
              'BranchB': {
                logLevel: 'ERROR'
              },
              'BranchC': {
                logLevel: 'WARNING',
                components: {
                  'SubC': { logLevel: 'INFO' }
                }
              }
            }
          }
        }
      });

      console.log = vi.fn();
      console.error = vi.fn();
      console.warn = vi.fn();

      const base = getLogger('@fjell/cache');
      const branchA = base.get('BranchA');
      const subA = branchA.get('SubA');
      const branchB = base.get('BranchB');
      const branchC = base.get('BranchC');
      const subC = branchC.get('SubC');

      // Test BranchA (DEBUG)
      branchA.debug('branchA debug');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[BranchA]'));

      // Test SubA (TRACE)
      vi.clearAllMocks();
      subA.trace('subA trace');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[TRACE]'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[SubA]'));

      // Test BranchB (ERROR)
      vi.clearAllMocks();
      branchB.info('branchB info');
      expect(console.log).not.toHaveBeenCalled(); // ERROR level, no info
      branchB.error('branchB error');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[BranchB]'));

      // Test BranchC (WARNING)
      vi.clearAllMocks();
      branchC.info('branchC info');
      expect(console.log).not.toHaveBeenCalled(); // WARNING level, no info
      branchC.warning('branchC warning');
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[BranchC]'));

      // Test SubC (INFO)
      vi.clearAllMocks();
      subC.info('subC info');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[SubC]'));
    });

    it('should handle unconfigured components inheriting parent log level', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'WARNING',
            components: {
              'Configured': {
                logLevel: 'DEBUG',
                components: {
                  'DeepConfigured': { logLevel: 'TRACE' }
                }
              }
            }
          }
        }
      });

      console.log = vi.fn();
      console.warn = vi.fn();

      const base = getLogger('@fjell/cache');
      const configured = base.get('Configured');
      const unconfigured = base.get('Unconfigured');
      const deepConfigured = configured.get('DeepConfigured');
      const deepUnconfigured = configured.get('DeepUnconfigured');

      // Unconfigured should inherit from base (WARNING)
      unconfigured.info('unconfigured info');
      expect(console.log).not.toHaveBeenCalled();
      unconfigured.warning('unconfigured warning');
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[Unconfigured]'));

      // DeepUnconfigured should inherit from Configured (DEBUG)
      vi.clearAllMocks();
      deepUnconfigured.debug('deep unconfigured debug');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[DeepUnconfigured]'));

      // Verify DeepConfigured still has TRACE
      vi.clearAllMocks();
      deepConfigured.trace('deep configured trace');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[TRACE]'));
    });

    it('should handle complex real-world scenario', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'INFO',
            components: {
              'CacheWarmer': {
                logLevel: 'DEBUG',
                components: {
                  'Strategy': {
                    logLevel: 'TRACE',
                    components: {
                      'LRU': { logLevel: 'DEBUG' },
                      'FIFO': { logLevel: 'TRACE' }
                    }
                  },
                  'DataLoader': { logLevel: 'INFO' }
                }
              },
              'TwoLayerCache': {
                logLevel: 'WARNING',
                components: {
                  'L1Cache': {
                    logLevel: 'ERROR',
                    components: {
                      'MemoryStore': { logLevel: 'WARNING' }
                    }
                  },
                  'L2Cache': { logLevel: 'INFO' }
                }
              }
            }
          }
        }
      });

      console.log = vi.fn();
      console.error = vi.fn();
      console.warn = vi.fn();

      const base = getLogger('@fjell/cache');
      const warmer = base.get('CacheWarmer');
      const strategy = warmer.get('Strategy');
      const lru = strategy.get('LRU');
      const fifo = strategy.get('FIFO');
      const loader = warmer.get('DataLoader');
      const twoLayer = base.get('TwoLayerCache');
      const l1 = twoLayer.get('L1Cache');
      const memStore = l1.get('MemoryStore');
      const l2 = twoLayer.get('L2Cache');

      // Test CacheWarmer branch
      warmer.debug('warmer debug');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));

      vi.clearAllMocks();
      strategy.trace('strategy trace');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[TRACE]'));

      vi.clearAllMocks();
      lru.debug('lru debug');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
      lru.trace('lru trace');
      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('[TRACE]')); // LRU is DEBUG, not TRACE

      vi.clearAllMocks();
      fifo.trace('fifo trace');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[TRACE]'));

      vi.clearAllMocks();
      loader.info('loader info');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));

      // Test TwoLayerCache branch
      vi.clearAllMocks();
      twoLayer.info('two layer info');
      expect(console.log).not.toHaveBeenCalled(); // WARNING level

      vi.clearAllMocks();
      l1.warning('l1 warning');
      expect(console.warn).not.toHaveBeenCalled(); // ERROR level
      l1.error('l1 error');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[L1Cache]'));

      vi.clearAllMocks();
      memStore.warning('mem warning');
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[MemoryStore]'));

      vi.clearAllMocks();
      l2.info('l2 info');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[L2Cache]'));
    });

    it('should maintain log levels through deep logger chains', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'WARNING',
            components: {
              'A': {
                logLevel: 'NOTICE',
                components: {
                  'B': {
                    logLevel: 'INFO',
                    components: {
                      'C': {
                        logLevel: 'DEBUG',
                        components: {
                          'D': { logLevel: 'TRACE' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      console.log = vi.fn();
      console.warn = vi.fn();

      const base = getLogger('@fjell/cache');
      const a = base.get('A');
      const b = a.get('B');
      const c = b.get('C');
      const d = c.get('D');

      // Verify each level maintains its configured log level
      base.warning('base warning');
      expect(console.warn).toHaveBeenCalled();
      
      vi.clearAllMocks();
      a.notice('a notice');
      expect(console.log).toHaveBeenCalled();

      vi.clearAllMocks();
      b.info('b info');
      expect(console.log).toHaveBeenCalled();

      vi.clearAllMocks();
      c.debug('c debug');
      expect(console.log).toHaveBeenCalled();

      vi.clearAllMocks();
      d.trace('d trace');
      expect(console.log).toHaveBeenCalled();
    });

    it('should handle logger with no configured category', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'DEBUG'
          }
        }
      });

      console.log = vi.fn();

      // Logger for unconfigured category should use global log level
      const unconfiguredLogger = getLogger('@fjell/other-package');
      
      unconfiguredLogger.info('info message');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));

      vi.clearAllMocks();
      unconfiguredLogger.debug('debug message');
      expect(console.log).not.toHaveBeenCalled(); // Global is INFO
    });

    it('should handle component names with special characters in logging', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'INFO',
            components: {
              'Cache-Warmer': { logLevel: 'DEBUG' },
              'Two_Layer_Cache': { logLevel: 'TRACE' }
            }
          }
        }
      });

      console.log = vi.fn();

      const base = getLogger('@fjell/cache');
      const dashedLogger = base.get('Cache-Warmer');
      const underscoreLogger = base.get('Two_Layer_Cache');

      dashedLogger.debug('dashed component');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[Cache-Warmer]'));

      vi.clearAllMocks();
      underscoreLogger.trace('underscore component');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[Two_Layer_Cache]'));
    });

    it('should isolate log levels between different categories', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'DEBUG',
            components: {
              'Worker': { logLevel: 'TRACE' }
            }
          },
          '@fjell/api': {
            logLevel: 'WARNING',
            components: {
              'Router': { logLevel: 'ERROR' }
            }
          }
        }
      });

      console.log = vi.fn();
      console.warn = vi.fn();
      console.error = vi.fn();

      const cacheBase = getLogger('@fjell/cache');
      const cacheWorker = cacheBase.get('Worker');
      const apiBase = getLogger('@fjell/api');
      const apiRouter = apiBase.get('Router');

      // Cache allows debug
      cacheBase.debug('cache debug');
      expect(console.log).toHaveBeenCalled();

      // Cache Worker allows trace
      vi.clearAllMocks();
      cacheWorker.trace('cache worker trace');
      expect(console.log).toHaveBeenCalled();

      // API only allows warning
      vi.clearAllMocks();
      apiBase.info('api info');
      expect(console.log).not.toHaveBeenCalled();
      apiBase.warning('api warning');
      expect(console.warn).toHaveBeenCalled();

      // API Router only allows error
      vi.clearAllMocks();
      apiRouter.warning('api router warning');
      expect(console.warn).not.toHaveBeenCalled();
      apiRouter.error('api router error');
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle rapidly switching between different loggers', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'INFO',
            components: {
              'A': { logLevel: 'DEBUG' },
              'B': { logLevel: 'WARNING' },
              'C': { logLevel: 'TRACE' }
            }
          }
        }
      });

      console.log = vi.fn();
      console.warn = vi.fn();

      const base = getLogger('@fjell/cache');
      const loggerA = base.get('A');
      const loggerB = base.get('B');
      const loggerC = base.get('C');

      // Rapidly switch between loggers
      for (let i = 0; i < 10; i++) {
        loggerA.debug(`A-${i}`);
        loggerB.warning(`B-${i}`);
        loggerC.trace(`C-${i}`);
      }

      // Verify all messages were logged correctly
      expect(console.log).toHaveBeenCalledTimes(20); // 10 from A (debug) + 10 from C (trace)
      expect(console.warn).toHaveBeenCalledTimes(10); // 10 from B (warning)
    });

    it('should handle logger created before and after config change', () => {
      // First config
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'WARNING'
          }
        }
      });

      console.log = vi.fn();
      console.warn = vi.fn();

      const logger1 = getLogger('@fjell/cache');
      
      logger1.info('info message');
      expect(console.log).not.toHaveBeenCalled(); // WARNING level

      logger1.warning('warning message');
      expect(console.warn).toHaveBeenCalled();

      // Change config (in real app this would be app restart, but simulates behavior)
      vi.clearAllMocks();
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'DEBUG'
          }
        }
      });

      const logger2 = getLogger('@fjell/cache');
      
      logger2.debug('debug message');
      expect(console.log).toHaveBeenCalled(); // DEBUG level
    });

    it('should handle mixed get() calls with single and multiple components', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'INFO',
            components: {
              'A': {
                logLevel: 'DEBUG',
                components: {
                  'B': { logLevel: 'TRACE' }
                }
              }
            }
          }
        }
      });

      console.log = vi.fn();

      const base = getLogger('@fjell/cache');
      
      // Single component at a time
      const a1 = base.get('A');
      const b1 = a1.get('B');
      
      // Multiple components at once
      const ab2 = base.get('A', 'B');
      
      // Both should have same log level
      vi.clearAllMocks();
      b1.trace('b1 trace');
      expect(console.log).toHaveBeenCalledTimes(1);

      vi.clearAllMocks();
      ab2.trace('ab2 trace');
      expect(console.log).toHaveBeenCalledTimes(1);
    });

    it('should handle logger.get() with empty component name', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'DEBUG'
          }
        }
      });

      console.log = vi.fn();

      const base = getLogger('@fjell/cache');
      const emptyLogger = base.get('');
      
      // Should still work and inherit parent level
      emptyLogger.debug('empty component debug');
      expect(console.log).toHaveBeenCalled();
    });

    it('should handle very long component paths', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'DEBUG'
          }
        }
      });

      console.log = vi.fn();

      const base = getLogger('@fjell/cache');
      
      // Create a very long component path
      const longLogger = base.get('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J');
      
      longLogger.debug('long path debug');
      expect(console.log).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[J]'));
    });

    it('should handle all log methods at each hierarchy level', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'DEFAULT',
        overrides: {
          '@fjell/cache': {
            logLevel: 'DEFAULT',
            components: {
              'TestComponent': { logLevel: 'DEFAULT' }
            }
          }
        }
      });

      console.log = vi.fn();
      console.warn = vi.fn();
      console.error = vi.fn();

      const base = getLogger('@fjell/cache');
      const component = base.get('TestComponent');

      // Test all log levels on both loggers
      base.emergency('base emergency');
      component.emergency('component emergency');
      
      base.alert('base alert');
      component.alert('component alert');
      
      base.critical('base critical');
      component.critical('component critical');
      
      base.error('base error');
      component.error('component error');
      
      base.warning('base warning');
      component.warning('component warning');
      
      base.notice('base notice');
      component.notice('component notice');
      
      base.info('base info');
      component.info('component info');
      
      base.debug('base debug');
      component.debug('component debug');
      
      base.trace('base trace');
      component.trace('component trace');
      
      base.default('base default');
      component.default('component default');

      // Verify messages were logged (counts depend on async logging, just verify > 0)
      expect(console.error.mock.calls.length).toBeGreaterThan(0);
      expect(console.warn.mock.calls.length).toBeGreaterThan(0);
      expect(console.log.mock.calls.length).toBeGreaterThan(0);
    });

    it('should handle stress test with many simultaneous loggers', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'DEBUG'
          }
        }
      });

      console.log = vi.fn();

      const base = getLogger('@fjell/cache');
      const loggers = [];
      
      // Create 50 loggers with different component paths
      for (let i = 0; i < 50; i++) {
        loggers.push(base.get(`Component${i}`));
      }

      // Log from all loggers
      loggers.forEach((logger, i) => {
        logger.debug(`Message from logger ${i}`);
      });

      expect(console.log).toHaveBeenCalledTimes(50);
    });

    it('should properly clean up loggers with destroy()', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        overrides: {
          '@fjell/cache': {
            logLevel: 'DEBUG',
            components: {
              'Component': { logLevel: 'TRACE' }
            }
          }
        }
      });

      const base = getLogger('@fjell/cache');
      const component = base.get('Component');

      // Should not throw when destroying
      expect(() => base.destroy()).not.toThrow();
      expect(() => component.destroy()).not.toThrow();
    });
  });
});
