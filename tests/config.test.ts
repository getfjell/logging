import {
  configureLogging,
  convertConfig,
  convertOverrides,
  defaultLoggingConfig
} from '../src/config';
import * as LogLevel from '../src/LogLevel';
import * as LogFormat from '../src/LogFormat';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Clear all relevant environment variables
    delete process.env.LOGGING_CONFIG;
    delete process.env.EXPO_PUBLIC_LOGGING_CONFIG;
    delete process.env.NEXT_PUBLIC_LOGGING_CONFIG;
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_FORMAT;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('defaultLoggingConfig', () => {
    it('should have correct default values', () => {
      expect(defaultLoggingConfig.logLevel).toBe(LogLevel.INFO);
      expect(defaultLoggingConfig.logFormat).toBe(LogFormat.TEXT);
      expect(defaultLoggingConfig.overrides).toEqual({});
      expect(defaultLoggingConfig.floodControl).toEqual({
        enabled: false,
        threshold: 10,
        timeframe: 1000,
      });
      expect(defaultLoggingConfig.masking).toBeDefined();
    });
  });

  describe('convertOverrides', () => {
    it('should convert valid overrides correctly', () => {
      const overrides = {
        'test-component': { logLevel: 'DEBUG' },
        'another-component': { logLevel: 'ERROR' }
      };

      const result = convertOverrides(overrides);
      expect(result).toEqual({
        'test-component': { logLevel: LogLevel.DEBUG },
        'another-component': { logLevel: LogLevel.ERROR }
      });
    });

    it('should use default log level when override logLevel is missing', () => {
      const overrides = {
        'test-component': {},
        'another-component': { logLevel: 'WARNING' }
      };

      const result = convertOverrides(overrides);
      expect(result).toEqual({
        'test-component': { logLevel: LogLevel.INFO },
        'another-component': { logLevel: LogLevel.WARNING }
      });
    });

    it('should return empty object when overrides is null', () => {
      const result = convertOverrides(null);
      expect(result).toEqual({});
    });

    it('should return empty object when overrides is undefined', () => {
      const result = convertOverrides(void 0);
      expect(result).toEqual({});
    });

    it('should return empty object when overrides is empty object', () => {
      const result = convertOverrides({});
      expect(result).toEqual({});
    });

    it('should handle overrides with invalid log level gracefully', () => {
      const overrides = {
        'test-component': { logLevel: 'INVALID_LEVEL' }
      };

      expect(() => convertOverrides(overrides)).toThrow(
        "Invalid Log Level Supplied to Logging Configuration 'INVALID_LEVEL'"
      );
    });
  });

  describe('convertConfig', () => {
    it('should convert valid config correctly', () => {
      const config = {
        logLevel: 'DEBUG',
        logFormat: 'STRUCTURED',
        overrides: {
          'test-component': { logLevel: 'ERROR' }
        },
        floodControl: {
          enabled: true,
          threshold: 20,
          timeframe: 2000
        },
        masking: {
          enabled: true
        }
      };

      const result = convertConfig(config);
      expect(result.logLevel).toBe(LogLevel.DEBUG);
      expect(result.logFormat).toBe(LogFormat.STRUCTURED);
      expect(result.overrides).toEqual({
        'test-component': { logLevel: LogLevel.ERROR }
      });
      expect(result.floodControl).toEqual({
        enabled: true,
        threshold: 20,
        timeframe: 2000
      });
      expect(result.masking).toEqual({
        ...defaultLoggingConfig.masking,
        enabled: true
      });
    });

    it('should use defaults when config properties are missing', () => {
      const config = {};

      const result = convertConfig(config);
      expect(result.logLevel).toBe(LogLevel.INFO);
      expect(result.logFormat).toBe(LogFormat.TEXT);
      expect(result.overrides).toEqual({});
      expect(result.floodControl).toEqual(defaultLoggingConfig.floodControl);
      expect(result.masking).toEqual(defaultLoggingConfig.masking);
    });

    it('should merge floodControl with defaults', () => {
      const config = {
        floodControl: {
          enabled: true
        }
      };

      const result = convertConfig(config);
      expect(result.floodControl).toEqual({
        enabled: true,
        threshold: 10,
        timeframe: 1000
      });
    });

    it('should merge masking with defaults', () => {
      const config = {
        masking: {
          enabled: true
        }
      };

      const result = convertConfig(config);
      expect(result.masking).toEqual({
        ...defaultLoggingConfig.masking,
        enabled: true
      });
    });

    it('should throw error when config is null', () => {
      expect(() => convertConfig(null)).toThrow();
    });

    it('should throw error when config is undefined', () => {
      expect(() => convertConfig(void 0)).toThrow();
    });

    it('should throw error when invalid logLevel is provided', () => {
      const config = {
        logLevel: 'INVALID_LEVEL'
      };

      expect(() => convertConfig(config)).toThrow(
        "Invalid Log Level Supplied to Logging Configuration 'INVALID_LEVEL'"
      );
    });

    it('should throw error when invalid logFormat is provided', () => {
      const config = {
        logFormat: 'INVALID_FORMAT'
      };

      expect(() => convertConfig(config)).toThrow(
        "Invalid Log Format Supplied to Logging Configuration 'INVALID_FORMAT'"
      );
    });
  });

  describe('configureLogging', () => {
    it('should return default config when no environment variables are set', () => {
      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.INFO);
      expect(config.logFormat).toBe(LogFormat.TEXT);
      expect(config.overrides).toEqual({});
      expect(config.floodControl).toEqual(defaultLoggingConfig.floodControl);
      expect(config.masking).toEqual(defaultLoggingConfig.masking);
    });

    it('should parse LOGGING_CONFIG environment variable', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'DEBUG',
        logFormat: 'STRUCTURED',
        overrides: {
          'test-component': { logLevel: 'ERROR' }
        }
      });

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.DEBUG);
      expect(config.logFormat).toBe(LogFormat.STRUCTURED);
      expect(config.overrides).toEqual({
        'test-component': { logLevel: LogLevel.ERROR }
      });
    });

    it('should parse EXPO_PUBLIC_LOGGING_CONFIG environment variable', () => {
      process.env.EXPO_PUBLIC_LOGGING_CONFIG = JSON.stringify({
        logLevel: 'WARNING',
        logFormat: 'TEXT'
      });

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.WARNING);
      expect(config.logFormat).toBe(LogFormat.TEXT);
    });

    it('should parse NEXT_PUBLIC_LOGGING_CONFIG environment variable', () => {
      process.env.NEXT_PUBLIC_LOGGING_CONFIG = JSON.stringify({
        logLevel: 'ERROR',
        logFormat: 'STRUCTURED'
      });

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.ERROR);
      expect(config.logFormat).toBe(LogFormat.STRUCTURED);
    });

    it('should prioritize LOGGING_CONFIG over EXPO_PUBLIC_LOGGING_CONFIG', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'DEBUG'
      });
      process.env.EXPO_PUBLIC_LOGGING_CONFIG = JSON.stringify({
        logLevel: 'ERROR'
      });

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.DEBUG);
    });

    it('should prioritize LOGGING_CONFIG over NEXT_PUBLIC_LOGGING_CONFIG', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'DEBUG'
      });
      process.env.NEXT_PUBLIC_LOGGING_CONFIG = JSON.stringify({
        logLevel: 'ERROR'
      });

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.DEBUG);
    });

    it('should prioritize EXPO_PUBLIC_LOGGING_CONFIG over NEXT_PUBLIC_LOGGING_CONFIG', () => {
      process.env.EXPO_PUBLIC_LOGGING_CONFIG = JSON.stringify({
        logLevel: 'DEBUG'
      });
      process.env.NEXT_PUBLIC_LOGGING_CONFIG = JSON.stringify({
        logLevel: 'ERROR'
      });

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.DEBUG);
    });

    it('should handle invalid JSON in LOGGING_CONFIG gracefully', () => {
      process.env.LOGGING_CONFIG = 'invalid json';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.INFO);
      expect(config.logFormat).toBe(LogFormat.TEXT);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid JSON in LOGGING_CONFIG environment variable:',
        expect.any(SyntaxError)
      );

      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON in EXPO_PUBLIC_LOGGING_CONFIG gracefully', () => {
      process.env.EXPO_PUBLIC_LOGGING_CONFIG = 'invalid json';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.INFO);
      expect(config.logFormat).toBe(LogFormat.TEXT);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid JSON in EXPO_PUBLIC_LOGGING_CONFIG environment variable:',
        expect.any(SyntaxError)
      );

      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON in NEXT_PUBLIC_LOGGING_CONFIG gracefully', () => {
      process.env.NEXT_PUBLIC_LOGGING_CONFIG = 'invalid json';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.INFO);
      expect(config.logFormat).toBe(LogFormat.TEXT);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid JSON in NEXT_PUBLIC_LOGGING_CONFIG environment variable:',
        expect.any(SyntaxError)
      );

      consoleSpy.mockRestore();
    });

    it('should override log level from LOG_LEVEL environment variable', () => {
      process.env.LOG_LEVEL = 'DEBUG';
      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.DEBUG);
    });

    it('should override log format from LOG_FORMAT environment variable', () => {
      process.env.LOG_FORMAT = 'STRUCTURED';
      const config = configureLogging();
      expect(config.logFormat).toBe(LogFormat.STRUCTURED);
    });

    it('should override config from environment variables over JSON config', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        logLevel: 'INFO',
        logFormat: 'TEXT'
      });
      process.env.LOG_LEVEL = 'ERROR';
      process.env.LOG_FORMAT = 'STRUCTURED';

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.ERROR);
      expect(config.logFormat).toBe(LogFormat.STRUCTURED);
    });

    it('should handle case-insensitive LOG_LEVEL', () => {
      process.env.LOG_LEVEL = 'debug';
      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.DEBUG);
    });

    it('should handle case-insensitive LOG_FORMAT', () => {
      process.env.LOG_FORMAT = 'structured';
      const config = configureLogging();
      expect(config.logFormat).toBe(LogFormat.STRUCTURED);
    });

    it('should throw error when invalid LOG_LEVEL is provided', () => {
      process.env.LOG_LEVEL = 'INVALID_LEVEL';

      expect(() => {
        configureLogging();
      }).toThrow("Invalid Log Level Supplied to Logging Configuration 'INVALID_LEVEL'");
    });

    it('should throw error when invalid LOG_FORMAT is provided', () => {
      process.env.LOG_FORMAT = 'INVALID_FORMAT';

      expect(() => {
        configureLogging();
      }).toThrow("Invalid Log Format Supplied to Logging Configuration 'INVALID_FORMAT'");
    });

    it('should merge environment config with defaults correctly', () => {
      process.env.LOGGING_CONFIG = JSON.stringify({
        floodControl: {
          enabled: true,
          threshold: 25
        }
      });

      const config = configureLogging();
      expect(config.floodControl).toEqual({
        enabled: true,
        threshold: 25,
        timeframe: 1000 // default value preserved
      });
    });

    it('should handle empty string environment variables', () => {
      process.env.LOG_LEVEL = '';
      process.env.LOG_FORMAT = '';

      const config = configureLogging();
      expect(config.logLevel).toBe(LogLevel.INFO);
      expect(config.logFormat).toBe(LogFormat.TEXT);
    });

    it('should throw error when whitespace-only environment variables are provided', () => {
      process.env.LOG_LEVEL = '   ';
      process.env.LOG_FORMAT = '  ';

      expect(() => configureLogging()).toThrow("Invalid Log Level Supplied to Logging Configuration '   '");
    });
  });
});
