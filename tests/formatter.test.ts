import { LoggingConfig } from '@/config';
import { createFormatter, getStructuredFormatter, getTextFormatter } from '@/formatter';
import * as LogFormat from '@/LogFormat';
import * as LogLevel from '@/LogLevel';
import util from 'util';
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

describe('Formatter', () => {
  const mockConfig: LoggingConfig = {
    logFormat: LogFormat.TEXT,
    logLevel: LogLevel.INFO,
    overrides: {}
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFormatter', () => {
    it('should return text formatter when format is TEXT', () => {
      mockConfig.logFormat = LogFormat.TEXT;
      const formatter = createFormatter(mockConfig.logFormat);
      expect(formatter.getLogFormat()).toEqual(LogFormat.TEXT);
    });

    it('should return structured formatter when format is STRUCTURED', () => {
      mockConfig.logFormat = LogFormat.STRUCTURED;
      const formatter = createFormatter(mockConfig.logFormat);
      expect(formatter.getLogFormat()).toEqual(LogFormat.STRUCTURED);
    });

    it('should throw error for unknown format', () => {
      mockConfig.logFormat = { name: 'UNKNOWN' as any, description: 'Unknown log format' } as any;
      expect(() => createFormatter(mockConfig.logFormat)).toThrow('Unknown log format: UNKNOWN');
    });
  });

  describe('TextFormatter', () => {
    const textFormatter = getTextFormatter();
    const testLevel: LogLevel.Config = LogLevel.INFO;
    const testCoordinates = {
      category: 'test-category',
      components: ['comp1', 'comp2']
    };
    const testPayload = {
      message: 'test message',
      data: ['test data']
    };

    it('should format log message correctly', () => {
      const result = textFormatter.formatLog(testLevel, testCoordinates, testPayload);
      expect(result).toContain(`[${LogLevel.INFO.name}]`);
      expect(result).toContain(`[${testCoordinates.category}]`);
      expect(result).toContain(`[${testCoordinates.components[0]}]`);
      expect(result).toContain(`[${testCoordinates.components[1]}]`);
      expect(result).toContain('test message');
      expect(result).toContain(util.inspect(['test data']));
    });

    it('should format timer message correctly', () => {
      const result = textFormatter.timerMessage(testLevel, testCoordinates, testPayload);
      expect(result).toContain(`[${LogLevel.INFO.name}]`);
      expect(result).toContain(`[${testCoordinates.category}]`);
      expect(result).toContain(`[${testCoordinates.components[0]}]`);
      expect(result).toContain(`[${testCoordinates.components[1]}]`);
      expect(result).toContain('test message');
      expect(result).toContain(JSON.stringify(['test data']));
      expect(result).toMatch(/\d{1,6}$/); // Should end with random number
    });
  });

  describe('StructuredFormatter', () => {
    const structuredFormatter = getStructuredFormatter();
    const testLevel: LogLevel.Config = LogLevel.ERROR;
    const testCoordinates = {
      category: 'test-category',
      components: ['comp1', 'comp2']
    };
    const testPayload = {
      message: 'test message with data %s',
      data: ['test data']
    };

    it('should format log message correctly', () => {
      const result = JSON.parse(structuredFormatter.formatLog(testLevel, testCoordinates, testPayload));
      expect(result.severity).toBe('ERROR');
      expect(result["logging.googleapis.com/labels"].category).toBe('test-category');
      expect(result["logging.googleapis.com/labels"].components).toBe('[comp1],[comp2]');
      expect(result.message).toBe('test message with data test data');
    });

    it('should format timer message correctly', () => {
      const result = JSON.parse(structuredFormatter.timerMessage(testLevel, testCoordinates, testPayload));
      expect(result.severity).toBe('ERROR');
      expect(result["logging.googleapis.com/labels"].category).toBe('test-category');
      expect(result["logging.googleapis.com/labels"].components).toBe('[comp1],[comp2]');
      expect(result.message).toBe('test message with data test data');
      expect(result["logging.googleapis.com/spanId"]).toMatch(/^\d{1,6}$/); // Should have numeric spanId
    });
  });

  describe('Formatter Data References', () => {
    const textFormatter = getTextFormatter();
    const structuredFormatter = getStructuredFormatter();
    const testLevel: LogLevel.Config = LogLevel.INFO;
    const testCoordinates = {
      category: 'test-category',
      components: ['comp1']
    };
    const testPayload = {
      message: 'test message with number %d',
      data: [42]
    };

    it('should format numeric data reference correctly in text format', () => {
      const result = textFormatter.formatLog(testLevel, testCoordinates, testPayload);
      expect(result).toContain('test message with number 42');
    });

    it('should format numeric data reference correctly in structured format', () => {
      const result = JSON.parse(structuredFormatter.formatLog(testLevel, testCoordinates, testPayload));
      expect(result.message).toBe('test message with number 42');
    });
  });

  describe('JSON Data References', () => {
    const textFormatter = getTextFormatter();
    const structuredFormatter = getStructuredFormatter();
    const testLevel: LogLevel.Config = LogLevel.INFO;
    const testCoordinates = {
      category: 'test-category',
      components: ['comp1']
    };
    const testPayload = {
      message: 'test message with JSON object %j',
      data: [{ foo: 'bar', num: 123 }]
    };

    it('should format JSON data reference correctly in text format', () => {
      const result = textFormatter.formatLog(testLevel, testCoordinates, testPayload);
      expect(result).toContain('test message with JSON object {"foo":"bar","num":123}');
    });

    it('should format JSON data reference correctly in structured format', () => {
      const result = JSON.parse(structuredFormatter.formatLog(testLevel, testCoordinates, testPayload));
      expect(result.message).toBe('test message with JSON object {"foo":"bar","num":123}');
    });
  });

  describe('Missing Data References', () => {
    const textFormatter = getTextFormatter();
    const structuredFormatter = getStructuredFormatter();
    const testLevel: LogLevel.Config = LogLevel.INFO;
    const testCoordinates = {
      category: 'test-category',
      components: ['comp1']
    };
    const testPayload = {
      message: 'test message with missing data %s',
      data: []
    };

    it('should handle missing data reference correctly in text format', () => {
      const result = textFormatter.formatLog(testLevel, testCoordinates, testPayload);
      expect(result).toContain('test message with missing data %s');
    });

    it('should handle missing data reference correctly in structured format', () => {
      const result = JSON.parse(structuredFormatter.formatLog(testLevel, testCoordinates, testPayload));
      expect(result.message).toBe('test message with missing data %s');
    });
  });

  describe('Multiple Format Specifiers', () => {
    const textFormatter = getTextFormatter();
    const structuredFormatter = getStructuredFormatter();
    const testLevel: LogLevel.Config = LogLevel.INFO;
    const testCoordinates = {
      category: 'test-category',
      components: ['comp1']
    };
    const testPayload = {
      message: 'integers: %i %d, float: %f, json: %j',
      data: [42, 123, 3.14159, { name: "test", values: [1, 2, 3] }]
    };

    it('should format multiple specifiers correctly in text format', () => {
      const result = textFormatter.formatLog(testLevel, testCoordinates, testPayload);
      expect(result).toContain('integers: 42 123, float: 3.14159, json: {"name":"test","values":[1,2,3]}');
    });

    it('should format multiple specifiers correctly in structured format', () => {
      const result = JSON.parse(structuredFormatter.formatLog(testLevel, testCoordinates, testPayload));
      expect(result.message).toBe('integers: 42 123, float: 3.14159, json: {"name":"test","values":[1,2,3]}');
    });
  });
});
