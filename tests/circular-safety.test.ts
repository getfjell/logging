/**
 * Tests to verify that circular references and non-serializable objects
 * NEVER crash the application - they are handled gracefully
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLogger } from '../src/logging';

describe('Circular Reference Safety - Application Resilience', () => {
  beforeEach(() => {
    // Set up environment for testing
    process.env.LOG_LEVEL = 'TRACE';
    process.env.LOGGING_CONFIG = '';
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should handle circular references in logged objects without crashing', () => {
    const logger = getLogger('test');

    const circular: any = { name: 'test' };
    circular.self = circular;

    // This should NOT crash the application
    expect(() => {
      logger.info('Circular object:', circular);
    }).not.toThrow();
  });

  it('should handle deeply nested circular references without crashing', () => {
    const logger = getLogger('test');

    const obj1: any = { name: 'obj1' };
    const obj2: any = { name: 'obj2', parent: obj1 };
    const obj3: any = { name: 'obj3', parent: obj2 };
    obj1.child = obj3;  // Create circular reference

    // This should NOT crash the application
    expect(() => {
      logger.info('Deeply nested circular:', obj1);
    }).not.toThrow();
  });

  it('should handle circular arrays without crashing', () => {
    const logger = getLogger('test');

    const arr: any[] = [1, 2, 3];
    arr.push(arr);  // Create circular reference

    // This should NOT crash the application
    expect(() => {
      logger.info('Circular array:', arr);
    }).not.toThrow();
  });

  it('should handle circular references in STRUCTURED format without crashing', () => {
    process.env.LOGGING_CONFIG = JSON.stringify({ logFormat: 'STRUCTURED', logLevel: 'INFO' });
    const logger = getLogger('test');

    const circular: any = { name: 'test', data: { nested: {} } };
    circular.data.nested.self = circular;

    // This should NOT crash the application - especially important for STRUCTURED logging
    expect(() => {
      logger.info('Circular in structured log', circular);
    }).not.toThrow();
  });

  it('should handle mixed circular and non-circular objects without crashing', () => {
    const logger = getLogger('test');

    const circular: any = { name: 'circular' };
    circular.self = circular;

    const normal = { name: 'normal', value: 123 };

    // This should NOT crash the application
    expect(() => {
      logger.info('Mixed objects:', normal, circular, 'some string', 42);
    }).not.toThrow();
  });

  it('should handle objects with getters that throw without crashing', () => {
    const logger = getLogger('test');

    const problematic = {
      name: 'test',
      get dangerous() {
        throw new Error('Getter failed');
      }
    };

    // This should NOT crash the application
    expect(() => {
      logger.info('Problematic object:', problematic);
    }).not.toThrow();
  });

  it('should handle BigInt values gracefully', () => {
    const logger = getLogger('test');

    const obj = {
      name: 'test',
      bigValue: BigInt(123456789)
    };

    // This should NOT crash the application
    expect(() => {
      logger.info('BigInt value:', obj);
    }).not.toThrow();
  });

  it('should handle Symbol properties gracefully', () => {
    const logger = getLogger('test');

    const sym = Symbol('test');
    const obj = {
      name: 'test',
      [sym]: 'symbol value'
    };

    // This should NOT crash the application
    expect(() => {
      logger.info('Symbol property:', obj);
    }).not.toThrow();
  });

  it('should handle complex real-world scenario without crashing', () => {
    process.env.LOGGING_CONFIG = JSON.stringify({ logFormat: 'STRUCTURED', logLevel: 'DEBUG' });
    const logger = getLogger('test').get('request', 'handler');

    // Simulate a real-world Express request-like object with circular references
    const req: any = {
      method: 'POST',
      url: '/api/users',
      headers: { 'content-type': 'application/json' },
      body: { name: 'John', email: 'john@example.com' }
    };

    const res: any = {
      statusCode: 200,
      req: req  // Response has reference to request
    };

    req.res = res;  // Request has reference to response (circular!)

    // Add some problematic properties
    req.socket = {
      connecting: false,
      _handle: { /* complex native object */ },
      [Symbol('kHandle')]: 'native'
    };

    // This should NOT crash the application even with all this complexity
    expect(() => {
      logger.debug('Processing request', req);
      logger.info('Sending response', res);
      logger.error('Request/Response pair', { req, res });
    }).not.toThrow();
  });

  it('should continue logging after encountering circular references', () => {
    const logger = getLogger('test');

    const circular: any = { name: 'circular' };
    circular.self = circular;

    // Log circular reference
    expect(() => {
      logger.info('First log with circular', circular);
    }).not.toThrow();

    // Logger should still work for subsequent logs
    expect(() => {
      logger.info('Second log is normal', { name: 'normal' });
    }).not.toThrow();

    // And should handle another circular reference
    const anotherCircular: any = { value: 123 };
    anotherCircular.ref = anotherCircular;

    expect(() => {
      logger.info('Third log with different circular', anotherCircular);
    }).not.toThrow();
  });
});

