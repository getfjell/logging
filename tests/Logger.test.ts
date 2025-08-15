import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLogger } from '../src/Logger';
import * as LogLevel from '../src/LogLevel';
import * as LogFormat from '../src/LogFormat';
import { FloodControlConfig } from '../src/FloodControl';

describe('Logger', () => {
  let mockConsole: any;

  beforeEach(() => {
    mockConsole = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      time: vi.fn(),
      timeEnd: vi.fn(),
      timeLog: vi.fn(),
    };

    // Mock console methods
    Object.defineProperty(global, 'console', {
      value: mockConsole,
      writable: true,
    });
  });

  describe('createLogger', () => {
    it('should create a logger with basic configuration', () => {
      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.INFO,
        { category: 'test', components: [] },
        { enabled: false, threshold: 0, timeframe: 0 }
      );

      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.time).toBe('function');
    });

    it('should create a logger with components', () => {
      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.INFO,
        { category: 'test', components: ['component1', 'component2'] },
        { enabled: false, threshold: 0, timeframe: 0 }
      );

      expect(logger).toBeDefined();
    });
  });

  describe('Log Level Filtering', () => {
    it('should filter messages below the configured log level', () => {
      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.WARNING, // Only WARNING and above
        { category: 'test', components: [] },
        { enabled: false, threshold: 0, timeframe: 0 }
      );

      logger.debug('Debug message'); // Should be filtered out
      logger.info('Info message');   // Should be filtered out
      logger.warning('Warning message'); // Should log
      logger.error('Error message');     // Should log

      expect(mockConsole.log).not.toHaveBeenCalledWith(expect.stringContaining('Debug message'));
      expect(mockConsole.log).not.toHaveBeenCalledWith(expect.stringContaining('Info message'));
      expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining('Warning message'));
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('Error message'));
    });

    it('should allow all messages when log level is TRACE', () => {
      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.TRACE,
        { category: 'test', components: [] },
        { enabled: false, threshold: 0, timeframe: 0 }
      );

      logger.trace('Trace message');
      logger.debug('Debug message');
      logger.info('Info message');

      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Trace message'));
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Debug message'));
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Info message'));
    });

    it('should only allow emergency messages when log level is EMERGENCY', () => {
      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.EMERGENCY,
        { category: 'test', components: [] },
        { enabled: false, threshold: 0, timeframe: 0 }
      );

      logger.emergency('Emergency message');
      logger.alert('Alert message');
      logger.info('Info message');

      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('Emergency message'));
      expect(mockConsole.error).not.toHaveBeenCalledWith(expect.stringContaining('Alert message'));
      expect(mockConsole.log).not.toHaveBeenCalledWith(expect.stringContaining('Info message'));
    });
  });

  describe('FloodControl Integration', () => {
    it('should log normally when flood control is disabled', () => {
      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.DEBUG,
        { category: 'test', components: [] },
        { enabled: false, threshold: 0, timeframe: 0 }
      );

      // Send the same message multiple times
      for (let i = 0; i < 10; i++) {
        logger.info('Repeated message');
      }

      expect(mockConsole.log).toHaveBeenCalledTimes(10);
    });

    it('should suppress repeated messages when flood control is enabled', () => {
      const floodControlConfig: FloodControlConfig = {
        enabled: true,
        threshold: 3, // Start suppressing after 3 messages
        timeframe: 1000, // 1 second window
      };

      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.DEBUG,
        { category: 'test', components: [] },
        floodControlConfig
      );

      // Send the same message multiple times
      for (let i = 0; i < 5; i++) {
        logger.info('Repeated message');
      }

      // Should log the first 3 messages, then start suppressing
      expect(mockConsole.log).toHaveBeenCalledTimes(4); // 3 original + 1 suppression notice
    });

    it('should resume logging when flood control threshold is no longer exceeded', () => {
      const floodControlConfig: FloodControlConfig = {
        enabled: true,
        threshold: 2, // Start suppressing after 2 messages
        timeframe: 100, // Very short window for testing
      };

      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.DEBUG,
        { category: 'test', components: [] },
        floodControlConfig
      );

      // Send 3 messages to trigger suppression
      logger.info('Repeated message');
      logger.info('Repeated message');
      logger.info('Repeated message');

      // Wait for the timeframe to expire
      return new Promise(resolve => {
        setTimeout(() => {
          // Send another message - should resume logging
          logger.info('Repeated message');

          // Should have logged: 2 original + 1 suppression notice + 1 resume notice + 1 current message
          expect(mockConsole.log).toHaveBeenCalledTimes(5);
          resolve(null);
        }, 150);
      });
    });

    it('should handle flood control with different message data', () => {
      const floodControlConfig: FloodControlConfig = {
        enabled: true,
        threshold: 2,
        timeframe: 1000,
      };

      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.DEBUG,
        { category: 'test', components: [] },
        floodControlConfig
      );

      // These should be treated as different messages due to different data
      logger.info('Message with data', { id: 1 });
      logger.info('Message with data', { id: 1 });
      logger.info('Message with data', { id: 1 }); // Should trigger suppression

      logger.info('Message with data', { id: 2 }); // Different data, should log normally

      expect(mockConsole.log).toHaveBeenCalledTimes(4); // 2 original + 1 suppression + 1 different message
    });

    it('should handle flood control suppression count edge cases', () => {
      const floodControlConfig: FloodControlConfig = {
        enabled: true,
        threshold: 2,
        timeframe: 1000,
      };

      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.DEBUG,
        { category: 'test', components: [] },
        floodControlConfig
      );

      // Send messages to trigger suppression
      logger.info('Repeated message');
      logger.info('Repeated message');
      logger.info('Repeated message'); // Triggers suppression

      // Send more messages to increase suppression count beyond 1
      logger.info('Repeated message'); // Should not log suppression notice (count > 1)
      logger.info('Repeated message'); // Should not log suppression notice (count > 1)

      // Should have: 2 original + 1 suppression notice + 2 suppressed
      expect(mockConsole.log).toHaveBeenCalledTimes(3);
    });

    it('should log suppression notice only on first suppression', () => {
      const floodControlConfig: FloodControlConfig = {
        enabled: true,
        threshold: 1, // Very low threshold to trigger suppression quickly
        timeframe: 1000,
      };

      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.DEBUG,
        { category: 'test', components: [] },
        floodControlConfig
      );

      // First message - should log
      logger.info('Test message');

      // Second message - should trigger suppression and log suppression notice
      logger.info('Test message');

      // Third message - should be suppressed without logging suppression notice
      logger.info('Test message');

      // Should have: 1 original + 1 suppression notice + 1 suppressed
      expect(mockConsole.log).toHaveBeenCalledTimes(2);
    });

    it('should handle exact suppression count of 1', () => {
      const floodControlConfig: FloodControlConfig = {
        enabled: true,
        threshold: 2, // Threshold of 2 means suppression starts on 3rd message
        timeframe: 1000,
      };

      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.DEBUG,
        { category: 'test', components: [] },
        floodControlConfig
      );

      // Send exactly threshold + 1 messages to trigger suppression with count = 1
      logger.info('Exact message');
      logger.info('Exact message');
      logger.info('Exact message'); // This triggers suppression with count = 1

      // The suppression notice should be logged because count === 1
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Started suppressing repeated log message'));
    });

    it('should handle very short timeframe for suppression count edge case', () => {
      const floodControlConfig: FloodControlConfig = {
        enabled: true,
        threshold: 1, // Very low threshold
        timeframe: 10, // Very short timeframe
      };

      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.DEBUG,
        { category: 'test', components: [] },
        floodControlConfig
      );

      // Send messages rapidly to trigger suppression
      logger.info('Rapid message');
      logger.info('Rapid message'); // Should trigger suppression with count = 1

      // Wait a bit for the timeframe to expire
      return new Promise(resolve => {
        setTimeout(() => {
          // Send another message - should resume logging
          logger.info('Rapid message');

          // Check if we got the suppression notice
          const logCalls = mockConsole.log.mock.calls;
          const hasSuppressionNotice = logCalls.some((call: any) =>
            call[0].includes('Started suppressing repeated log message')
          );

          expect(hasSuppressionNotice).toBe(true);
          resolve(null);
        }, 50);
      });
    });
  });

  describe('Timer Functionality', () => {
    it('should not start timer when log level is below DEBUG', () => {
      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.INFO, // Below DEBUG
        { category: 'test', components: [] },
        { enabled: false, threshold: 0, timeframe: 0 }
      );

      const timer = logger.time('Timer message');

      expect(mockConsole.time).not.toHaveBeenCalled();

      timer.end();
      expect(mockConsole.timeEnd).not.toHaveBeenCalled();
    });

    it('should start timer when log level is DEBUG or above', () => {
      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.DEBUG,
        { category: 'test', components: [] },
        { enabled: false, threshold: 0, timeframe: 0 }
      );

      const timer = logger.time('Timer message');

      expect(mockConsole.time).toHaveBeenCalled();

      timer.log('Intermediate log');
      expect(mockConsole.timeLog).toHaveBeenCalled();

      timer.end();
      expect(mockConsole.timeEnd).toHaveBeenCalled();
    });

    it('should handle timer with data parameters', () => {
      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.DEBUG,
        { category: 'test', components: [] },
        { enabled: false, threshold: 0, timeframe: 0 }
      );

      const timer = logger.time('Timer message', { context: 'test' });

      expect(mockConsole.time).toHaveBeenCalled();

      timer.log('Intermediate log', { step: 1 });
      expect(mockConsole.timeLog).toHaveBeenCalledWith(expect.any(String), 'Intermediate log', { step: 1 });

      timer.end();
      expect(mockConsole.timeEnd).toHaveBeenCalled();
    });
  });

  describe('Logger Methods', () => {
    let logger: any;

    beforeEach(() => {
      logger = createLogger(
        LogFormat.TEXT,
        LogLevel.DEFAULT, // Use DEFAULT to allow all log levels
        { category: 'test', components: [] },
        { enabled: false, threshold: 0, timeframe: 0 }
      );
    });

    it('should call emergency method correctly', () => {
      logger.emergency('Emergency message', { data: 'test' });
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('Emergency message'));
    });

    it('should call alert method correctly', () => {
      logger.alert('Alert message', { data: 'test' });
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('Alert message'));
    });

    it('should call critical method correctly', () => {
      logger.critical('Critical message', { data: 'test' });
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('Critical message'));
    });

    it('should call error method correctly', () => {
      logger.error('Error message', { data: 'test' });
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('Error message'));
    });

    it('should call warning method correctly', () => {
      logger.warning('Warning message', { data: 'test' });
      expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining('Warning message'));
    });

    it('should call notice method correctly', () => {
      logger.notice('Notice message', { data: 'test' });
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Notice message'));
    });

    it('should call info method correctly', () => {
      logger.info('Info message', { data: 'test' });
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Info message'));
    });

    it('should call debug method correctly', () => {
      logger.debug('Debug message', { data: 'test' });
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Debug message'));
    });

    it('should call trace method correctly', () => {
      logger.trace('Trace message', { data: 'test' });
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Trace message'));
    });

    it('should call default method correctly', () => {
      logger.default('Default message', { data: 'test' });
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Default message'));
    });
  });

  describe('Logger.get() method', () => {
    it('should create a new logger with additional components', () => {
      const baseLogger = createLogger(
        LogFormat.TEXT,
        LogLevel.DEBUG,
        { category: 'base', components: ['comp1'] },
        { enabled: false, threshold: 0, timeframe: 0 }
      );

      const extendedLogger = baseLogger.get('comp2', 'comp3');

      extendedLogger.info('Extended logger message');

      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Extended logger message'));
    });

    it('should preserve original logger configuration', () => {
      const baseLogger = createLogger(
        LogFormat.STRUCTURED,
        LogLevel.ERROR,
        { category: 'base', components: ['comp1'] },
        { enabled: true, threshold: 5, timeframe: 2000 }
      );

      const extendedLogger = baseLogger.get('comp2');

      // Should respect the ERROR log level
      extendedLogger.info('Info message'); // Should be filtered out
      extendedLogger.error('Error message'); // Should log

      expect(mockConsole.log).not.toHaveBeenCalledWith(expect.stringContaining('Info message'));
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('Error message'));
    });
  });

  describe('Logger.destroy() method', () => {
    it('should call destroy on flood control when enabled', () => {
      const floodControlConfig: FloodControlConfig = {
        enabled: true,
        threshold: 5,
        timeframe: 1000,
      };

      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.DEBUG,
        { category: 'test', components: [] },
        floodControlConfig
      );

      // Should not throw an error when destroy is called
      expect(() => logger.destroy()).not.toThrow();
    });

    it('should not call destroy when flood control is disabled', () => {
      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.DEBUG,
        { category: 'test', components: [] },
        { enabled: false, threshold: 0, timeframe: 0 }
      );

      // Should not throw an error
      expect(() => logger.destroy()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message strings', () => {
      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.DEBUG,
        { category: 'test', components: [] },
        { enabled: false, threshold: 0, timeframe: 0 }
      );

      logger.info('');
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining(''));
    });

    it('should handle undefined data parameters', () => {
      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.DEBUG,
        { category: 'test', components: [] },
        { enabled: false, threshold: 0, timeframe: 0 }
      );

      logger.info('Message with undefined data', null);
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Message with undefined data'));
    });

    it('should handle null data parameters', () => {
      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.DEBUG,
        { category: 'test', components: [] },
        { enabled: false, threshold: 0, timeframe: 0 }
      );

      logger.info('Message with null data', null);
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Message with null data'));
    });

    it('should handle circular reference data gracefully', () => {
      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.DEBUG,
        { category: 'test', components: [] },
        { enabled: false, threshold: 0, timeframe: 0 }
      );

      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      // Should not throw an error
      expect(() => logger.info('Message with circular data', circularObj)).not.toThrow();
    });
  });

  describe('Writer Options Integration', () => {
    it('should pass writer options to the writer', () => {
      const writerOptions = {
        respectInjectedMethod: true,
        errorMethod: vi.fn(),
        warningMethod: vi.fn(),
        infoMethod: vi.fn(),
      };

      const logger = createLogger(
        LogFormat.TEXT,
        LogLevel.DEBUG,
        { category: 'test', components: [] },
        { enabled: false, threshold: 0, timeframe: 0 },
        writerOptions
      );

      logger.info('Test message');

      // The writer should have been created with the options
      expect(mockConsole.log).toHaveBeenCalled();
    });
  });
});
