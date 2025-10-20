/**
 * Example: Circular Reference Protection
 *
 * This example demonstrates how the logging library handles circular references
 * and other non-serializable objects without crashing your application.
 */

import { getLogger } from '../src/logging';

// Set up logging environment
process.env.LOG_LEVEL = 'DEBUG';
process.env.LOGGING_CONFIG = JSON.stringify({
  logLevel: 'DEBUG',
  logFormat: 'TEXT'
});

const logger = getLogger('circular-example');

console.log('=== Circular Reference Protection Examples ===\n');

// Example 1: Simple circular reference
console.log('1. Simple Circular Reference:');
const simpleCircular: any = { name: 'John', age: 30 };
simpleCircular.self = simpleCircular;

logger.info('Simple circular object', simpleCircular);
console.log('✓ No crash! Circular reference handled safely\n');

// Example 2: Nested circular reference
console.log('2. Nested Circular Reference:');
const parent: any = { name: 'Parent', id: 1 };
const child: any = { name: 'Child', id: 2, parent: parent };
parent.child = child;

logger.info('Nested circular structure', parent);
console.log('✓ No crash! Nested circular reference handled\n');

// Example 3: Multiple circular references
console.log('3. Multiple Circular References:');
const user1: any = { name: 'Alice' };
const user2: any = { name: 'Bob' };
user1.friend = user2;
user2.friend = user1;

logger.info('User relationships', user1);
console.log('✓ No crash! Multiple circular references handled\n');

// Example 4: Circular array
console.log('4. Circular Array:');
const circularArray: any[] = [1, 2, 3];
circularArray.push(circularArray);

logger.info('Circular array', circularArray);
console.log('✓ No crash! Circular array handled\n');

// Example 5: Real-world scenario - Express-like request/response
console.log('5. Real-World Express-Like Scenario:');
const mockRequest: any = {
  method: 'POST',
  url: '/api/users',
  headers: { 'content-type': 'application/json' },
  body: { name: 'John', email: 'john@example.com' }
};

const mockResponse: any = {
  statusCode: 200,
  req: mockRequest
};

mockRequest.res = mockResponse;  // Create circular reference like Express does

logger.info('Express request/response', { req: mockRequest, res: mockResponse });
console.log('✓ No crash! Complex circular structure handled\n');

// Example 6: Mixed with other non-serializable types
console.log('6. Mixed Non-Serializable Types:');
const mixedObject: any = {
  name: 'Test',
  date: new Date(),
  regex: /test/gi,
  func: () => 'hello',
  symbol: Symbol('test')
};
mixedObject.self = mixedObject;

logger.info('Mixed types with circular reference', mixedObject);
console.log('✓ No crash! All non-serializable types handled\n');

// Example 7: STRUCTURED logging format (important for production)
console.log('7. STRUCTURED Logging Format (Production):');
process.env.LOGGING_CONFIG = JSON.stringify({
  logLevel: 'INFO',
  logFormat: 'STRUCTURED'
});

const prodLogger = getLogger('production-app');
const circularProdData: any = {
  userId: 123,
  action: 'login',
  metadata: { timestamp: new Date() }
};
circularProdData.metadata.event = circularProdData;

prodLogger.info('Production log with circular reference', circularProdData);
console.log('✓ No crash! STRUCTURED format handles circular references\n');

// Example 8: BigInt handling
console.log('8. BigInt Values:');
const bigIntData = {
  id: 123,
  largeNumber: BigInt(9007199254740991)
};

logger.info('BigInt data', bigIntData);
console.log('✓ No crash! BigInt handled gracefully\n');

// Example 9: Deeply nested with circular reference
console.log('9. Deeply Nested Structure:');
const deep: any = {
  level1: {
    level2: {
      level3: {
        level4: {
          level5: {
            data: 'Deep data'
          }
        }
      }
    }
  }
};
deep.level1.level2.level3.level4.level5.backToTop = deep;

logger.info('Deeply nested circular', deep);
console.log('✓ No crash! Deep nesting with circular reference handled\n');

// Example 10: Continuing after circular reference
console.log('10. Logging Continues After Circular Reference:');
logger.info('First log with circular', simpleCircular);
logger.info('Second log is normal', { name: 'Normal object', value: 42 });
logger.info('Third log with different circular', circularArray);

console.log('✓ All logs succeeded! Logger continues working after circular references\n');

console.log('=== All Examples Completed Successfully ===');
console.log('Your application is protected from circular reference crashes!');

