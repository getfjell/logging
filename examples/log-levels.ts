/**
 * Log Levels Example for @fjell/logging
 *
 * This example demonstrates all available log levels and their appropriate use cases.
 * Run with different LOG_LEVEL environment variables to see filtering in action:
 *
 * LOG_LEVEL=ERROR npx tsx examples/log-levels.ts
 * LOG_LEVEL=INFO npx tsx examples/log-levels.ts
 * LOG_LEVEL=DEBUG npx tsx examples/log-levels.ts
 */

import fjellLogging from '@fjell/logging';

const { getLogger } = fjellLogging;

// Create a logger for this example
const logger = getLogger('log-levels-example');

console.log('=== Log Levels Demonstration ===\n');
console.log(`Current LOG_LEVEL: ${process.env.LOG_LEVEL || 'INFO (default)'}\n`);

// Emergency (Level 0) - System is unusable
logger.emergency('System is completely down - immediate action required!', {
  severity: 'CRITICAL',
  affectedServices: ['api', 'database', 'cache'],
  estimatedDowntime: '30 minutes'
});

// Alert (Level 1) - Action must be taken immediately
logger.alert('Database server is unresponsive', {
  server: 'db-primary-01',
  lastResponse: '2 minutes ago',
  connectionPool: 'exhausted'
});

// Critical (Level 2) - Critical conditions
logger.critical('Payment processing service failure', {
  service: 'payment-gateway',
  errorRate: '95%',
  transactionsLost: 247
});

// Error (Level 3) - Error conditions
logger.error('Failed to process user request', {
  userId: 'user-12345',
  endpoint: '/api/orders',
  error: 'ValidationError: Invalid payment method',
  requestId: 'req-67890'
});

// Warning (Level 4) - Warning conditions
logger.warning('High memory usage detected', {
  currentUsage: '85%',
  threshold: '80%',
  processId: 'api-server-3',
  recommendation: 'Consider scaling up'
});

// Notice (Level 5) - Normal but significant condition
logger.notice('New user registration completed', {
  userId: 'user-99999',
  email: 'newuser@example.com',
  source: 'web-signup',
  verificationRequired: true
});

// Info (Level 6) - Informational messages
logger.info('Processing daily report generation', {
  reportType: 'sales-summary',
  dateRange: '2024-01-01 to 2024-01-31',
  recordCount: 15420,
  estimatedTime: '5 minutes'
});

// Debug (Level 7) - Debug-level messages
logger.debug('Cache hit for user profile', {
  userId: 'user-12345',
  cacheKey: 'profile:user-12345',
  hitRate: '92%',
  responseTime: '2ms'
});

// Default (Level 8) - Default level messages
logger.default('Routine maintenance task completed', {
  task: 'log-rotation',
  duration: '30 seconds',
  filesProcessed: 245,
  spaceFreed: '1.2GB'
});

console.log('\n=== Log Level Hierarchy ===\n');
console.log('Emergency (0) <- Alert (1) <- Critical (2) <- Error (3) <- Warning (4) <- Notice (5) <- Info (6) <- Debug (7) <- Default (8)');
console.log('\nWhen LOG_LEVEL is set to a specific level, only messages at that level or lower will be shown.');
console.log('For example, LOG_LEVEL=WARNING will show Emergency, Alert, Critical, Error, and Warning messages.');

console.log('\n=== Try These Commands ===\n');
console.log('LOG_LEVEL=EMERGENCY npx tsx examples/log-levels.ts  # Only emergency messages');
console.log('LOG_LEVEL=ERROR npx tsx examples/log-levels.ts      # Emergency through error messages');
console.log('LOG_LEVEL=INFO npx tsx examples/log-levels.ts       # Emergency through info messages (default)');
console.log('LOG_LEVEL=DEBUG npx tsx examples/log-levels.ts      # All messages except default');
console.log('LOG_LEVEL=DEFAULT npx tsx examples/log-levels.ts    # All messages');

console.log('\n=== End of Log Levels Example ===');
