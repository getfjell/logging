/**
 * Basic Usage Example for @fjell/logging
 *
 * This example demonstrates the fundamental features of fjell-logging:
 * - Creating logger instances
 * - Basic logging methods
 * - Logging with additional data
 */

import fjellLogging from '@fjell/logging';

const { getLogger } = fjellLogging;

// Create a logger instance with a descriptive name
const logger = getLogger('basic-example');

console.log('=== Basic Logging Examples ===\n');

// Simple text messages
logger.info('Application starting up');
logger.warning('This is a warning message');
logger.error('An error occurred');

console.log('\n=== Logging with Additional Data ===\n');

// Logging with additional context data
logger.info('User logged in', {
  userId: '12345',
  username: 'john_doe',
  timestamp: new Date().toISOString()
});

logger.error('Database connection failed', {
  error: 'Connection timeout',
  host: 'localhost',
  port: 5432,
  retries: 3
});

// Logging objects and arrays
const userProfile = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  preferences: {
    theme: 'dark',
    notifications: true
  }
};

logger.debug('User profile loaded', userProfile);

console.log('\n=== Different Message Types ===\n');

// Different types of log messages
logger.notice('System maintenance scheduled for tonight');
logger.alert('High memory usage detected');
logger.critical('Service is down');

// Multiple data arguments
logger.info('Processing request',
  { requestId: 'req-123' },
  { method: 'POST' },
  { path: '/api/users' }
);

console.log('\n=== Error Logging with Stack Traces ===\n');

// Logging actual errors
try {
  throw new Error('Something went wrong in the application');
} catch (error) {
  logger.error('Caught an exception', {
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error
  });
}

console.log('\n=== End of Basic Usage Examples ===');
