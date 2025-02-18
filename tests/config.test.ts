import { configureLogging } from '@/config';
import * as LogLevel from '@/LogLevel';
jest.mock('@fjell/logging', () => {
  return {
    get: jest.fn().mockReturnThis(),
    getLogger: jest.fn().mockReturnThis(),
    default: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    emergency: jest.fn(),
    alert: jest.fn(),
    critical: jest.fn(),
    notice: jest.fn(),
    time: jest.fn().mockReturnThis(),
    end: jest.fn(),
    log: jest.fn(),
  }
});

describe('configureLogging', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should throw error when invalid LOG_FORMAT is provided', () => {
    process.env.LOG_FORMAT = 'INVALID_FORMAT';
    
    expect(() => {
      configureLogging();
    }).toThrow("Invalid Log Format Supplied to Logging Configuration 'INVALID_FORMAT'");
  });

  it('should throw error when invalid LOG_LEVEL is provided', () => {
    process.env.LOG_LEVEL = 'INVALID_LEVEL';
    
    expect(() => {
      configureLogging();
    }).toThrow("Invalid Log Level Supplied to Logging Configuration 'INVALID_LEVEL'");
  });

  it('should set logFormat when valid LOG_FORMAT is provided', () => {
    process.env.LOG_FORMAT = 'STRUCTURED';
    const config = configureLogging();
    expect(config.logFormat.name).toBe('STRUCTURED');
  });

  it('should set logFormat to TEXT by default when no LOG_FORMAT is provided', () => {
    process.env.LOG_FORMAT = '';
    const config = configureLogging();
    expect(config.logFormat.name).toBe('TEXT');
  });

  it('should set overrides when provided in environment config', () => {
    process.env.LOGGING_CONFIG = JSON.stringify({
      logLevel: 'INFO',
      overrides: {
        'test-component': { logLevel: 'DEBUG' },
        'another-component': { logLevel: 'ERROR' }
      }
    });

    const config = configureLogging();
    expect(config.overrides).toEqual({
      'test-component': { logLevel: LogLevel.DEBUG },
      'another-component': { logLevel: LogLevel.ERROR }
    });
  });

  it('should default overrides to empty object when not provided', () => {
    process.env.LOGGING_CONFIG = JSON.stringify({
      logLevel: 'INFO'
    });

    const config = configureLogging();
    expect(config.overrides).toEqual({});
  });

});
