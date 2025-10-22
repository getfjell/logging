import { describe, expect, it } from 'vitest';
import { performance } from 'perf_hooks';
import {
  defaultMaskingConfig,
  MaskingConfig,
  maskObject,
  maskString,
  maskWithConfig
} from '../src/utils/maskSensitive';
import {
  createMaskingMiddleware
} from '../src/middleware/maskMiddleware';

describe('Masking Timing', () => {
  // Test data with various sensitive information patterns
  const sensitiveStrings = [
    'User admin@example.com logged in successfully',
    'SSN: 123-45-6789',
    'Private key: -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\n-----END PRIVATE KEY-----',
    'JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    'Base64 data: ' + 'a'.repeat(250),
    'Safe message with no sensitive data',
    'Another safe message',
    'Email: user@domain.com and SSN: 987-65-4321',
    'Mixed content: normal text with admin@company.com and 111-22-3333',
    'Long base64: ' + 'b'.repeat(300)
  ];

  const sensitiveObjects = [
    {
      user: 'john@example.com',
      ssn: '123-45-6789',
      data: { email: 'admin@company.com', ssn: '987-65-4321' }
    },
    {
      message: 'User authenticated',
      credentials: {
        email: 'user@domain.com',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\n-----END PRIVATE KEY-----'
      }
    },
    {
      log: 'System event',
      metadata: {
        userId: '12345',
        email: 'system@company.com',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      }
    }
  ];

  const logEntries = [
    {
      level: 'info',
      message: 'User admin@example.com logged in',
      timestamp: '2023-01-01T00:00:00Z',
      data: { email: 'admin@example.com', ssn: '123-45-6789' }
    },
    {
      level: 'warn',
      message: 'Authentication failed for user@domain.com',
      timestamp: '2023-01-01T00:00:00Z',
      data: { email: 'user@domain.com', ip: '192.168.1.100' }
    },
    {
      level: 'error',
      message: 'Private key validation failed',
      timestamp: '2023-01-01T00:00:00Z',
      data: {
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\n-----END PRIVATE KEY-----'
      }
    }
  ];

  it('should measure the performance overhead of string masking', () => {
    const iterations = 10000;

    // Test without masking
    const startNoMasking = performance.now();
    for (let i = 0; i < iterations; i++) {
      const testString = sensitiveStrings[i % sensitiveStrings.length];
      // Just access the string to simulate some work
      testString.length;
    }
    const endNoMasking = performance.now();
    const durationNoMasking = endNoMasking - startNoMasking;

    // Test with masking enabled
    const startWithMasking = performance.now();
    for (let i = 0; i < iterations; i++) {
      const testString = sensitiveStrings[i % sensitiveStrings.length];
      maskString(testString);
    }
    const endWithMasking = performance.now();
    const durationWithMasking = endWithMasking - startWithMasking;

    console.log(`String masking performance test (${iterations} iterations):`);
    console.log(`  Without masking: ${durationNoMasking.toFixed(2)}ms`);
    console.log(`  With masking: ${durationWithMasking.toFixed(2)}ms`);
    console.log(`  Overhead per call: ${((durationWithMasking - durationNoMasking) / iterations * 1000).toFixed(4)} microseconds`);

    const overheadPercentage = ((durationWithMasking - durationNoMasking) / durationNoMasking) * 100;
    console.log(`  Overhead percentage: ${overheadPercentage.toFixed(2)}%`);

    // Allow for some variance but ensure reasonable performance
    expect(overheadPercentage).toBeLessThan(10000); // Allow for realistic regex overhead
  });

  it('should measure the performance overhead of object masking', () => {
    const iterations = 5000; // Fewer iterations for objects due to complexity

    // Test without masking
    const startNoMasking = performance.now();
    for (let i = 0; i < iterations; i++) {
      const testObj = sensitiveObjects[i % sensitiveObjects.length];
      // Just access the object to simulate some work
      JSON.stringify(testObj);
    }
    const endNoMasking = performance.now();
    const durationNoMasking = endNoMasking - startNoMasking;

    // Test with masking enabled
    const startWithMasking = performance.now();
    for (let i = 0; i < iterations; i++) {
      const testObj = sensitiveObjects[i % sensitiveObjects.length];
      maskObject(testObj);
    }
    const endWithMasking = performance.now();
    const durationWithMasking = endWithMasking - startWithMasking;

    console.log(`Object masking performance test (${iterations} iterations):`);
    console.log(`  Without masking: ${durationNoMasking.toFixed(2)}ms`);
    console.log(`  With masking: ${durationWithMasking.toFixed(2)}ms`);
    console.log(`  Overhead per call: ${((durationWithMasking - durationNoMasking) / iterations * 1000).toFixed(4)} microseconds`);

    const overheadPercentage = ((durationWithMasking - durationNoMasking) / durationNoMasking) * 100;
    console.log(`  Overhead percentage: ${overheadPercentage.toFixed(2)}%`);

    // Allow for some variance but ensure reasonable performance
    expect(overheadPercentage).toBeLessThan(5000); // Allow for realistic object traversal overhead
  });

  it('should measure the performance overhead of middleware masking', () => {
    const iterations = 3000; // Fewer iterations for middleware

    const maskingMiddleware = createMaskingMiddleware({
      ...defaultMaskingConfig,
      enabled: true
    });

    // Test without masking
    const startNoMasking = performance.now();
    for (let i = 0; i < iterations; i++) {
      const testEntry = logEntries[i % logEntries.length];
      // Just access the entry to simulate some work
      JSON.stringify(testEntry);
    }
    const endNoMasking = performance.now();
    const durationNoMasking = endNoMasking - startNoMasking;

    // Test with masking enabled
    const startWithMasking = performance.now();
    for (let i = 0; i < iterations; i++) {
      const testEntry = logEntries[i % logEntries.length];
      maskingMiddleware(testEntry);
    }
    const endWithMasking = performance.now();
    const durationWithMasking = endWithMasking - startWithMasking;

    console.log(`Middleware masking performance test (${iterations} iterations):`);
    console.log(`  Without masking: ${durationNoMasking.toFixed(2)}ms`);
    console.log(`  With masking: ${durationWithMasking.toFixed(2)}ms`);
    console.log(`  Overhead per call: ${((durationWithMasking - durationNoMasking) / iterations * 1000).toFixed(4)} microseconds`);

    const overheadPercentage = ((durationWithMasking - durationNoMasking) / durationNoMasking) * 100;
    console.log(`  Overhead percentage: ${overheadPercentage.toFixed(2)}%`);

    // Allow for some variance but ensure reasonable performance
    expect(overheadPercentage).toBeLessThan(2000); // Allow for realistic middleware overhead
  });

  it('should measure the performance impact of disabled masking', () => {
    const iterations = 10000;

    // Test with masking disabled (should have minimal overhead)
    const startDisabled = performance.now();
    for (let i = 0; i < iterations; i++) {
      const testString = sensitiveStrings[i % sensitiveStrings.length];
      maskWithConfig(testString, { ...defaultMaskingConfig, enabled: false });
    }
    const endDisabled = performance.now();
    const durationDisabled = endDisabled - startDisabled;

    // Test with no masking function call at all
    const startNoCall = performance.now();
    for (let i = 0; i < iterations; i++) {
      const testString = sensitiveStrings[i % sensitiveStrings.length];
      // Just access the string to simulate some work
      testString.length;
    }
    const endNoCall = performance.now();
    const durationNoCall = endNoCall - startNoCall;

    console.log(`Disabled masking performance test (${iterations} iterations):`);
    console.log(`  No function call: ${durationNoCall.toFixed(2)}ms`);
    console.log(`  Disabled masking: ${durationDisabled.toFixed(2)}ms`);
    console.log(`  Overhead per call: ${((durationDisabled - durationNoCall) / iterations * 1000).toFixed(4)} microseconds`);

    const overheadPercentage = ((durationDisabled - durationNoCall) / durationNoCall) * 100;
    console.log(`  Overhead percentage: ${overheadPercentage.toFixed(2)}%`);

    // Disabled masking should have reasonable overhead (function call overhead)
    expect(overheadPercentage).toBeLessThan(1000); // Allow for function call overhead
  });

  it('should measure the performance impact of different masking configurations', () => {
    const iterations = 5000;
    const testString = 'User admin@example.com logged in with SSN 123-45-6789 and private key ' +
      '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\n-----END PRIVATE KEY-----';

    // Test with minimal masking (only emails)
    const minimalConfig: MaskingConfig = {
      enabled: true,
      maskEmails: true,
      maskSSNs: false,
      maskPrivateKeys: false,
      maskBase64Blobs: false,
      maskJWTs: false,
      maxDepth: 8
    };

    const startMinimal = performance.now();
    for (let i = 0; i < iterations; i++) {
      maskWithConfig(testString, minimalConfig);
    }
    const endMinimal = performance.now();
    const durationMinimal = endMinimal - startMinimal;

    // Test with full masking (all rules enabled)
    const fullConfig: MaskingConfig = {
      enabled: true,
      maskEmails: true,
      maskSSNs: true,
      maskPrivateKeys: true,
      maskBase64Blobs: true,
      maskJWTs: true,
      maxDepth: 8
    };

    const startFull = performance.now();
    for (let i = 0; i < iterations; i++) {
      maskWithConfig(testString, fullConfig);
    }
    const endFull = performance.now();
    const durationFull = endFull - startFull;

    console.log(`Configuration performance comparison (${iterations} iterations):`);
    console.log(`  Minimal masking (emails only): ${durationMinimal.toFixed(2)}ms`);
    console.log(`  Full masking (all rules): ${durationFull.toFixed(2)}ms`);
    console.log(`  Difference per call: ${((durationFull - durationMinimal) / iterations * 1000).toFixed(4)} microseconds`);

    const differencePercentage = ((durationFull - durationMinimal) / durationMinimal) * 100;
    console.log(`  Difference percentage: ${differencePercentage.toFixed(2)}%`);

    // Full masking should not be dramatically slower than minimal masking
    expect(differencePercentage).toBeLessThan(100); // Should not be more than 100% slower
  });
});
