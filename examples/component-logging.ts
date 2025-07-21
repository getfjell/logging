/**
 * Component-Based Logging Example for @fjell/logging
 *
 * This example demonstrates how to organize loggers by components or modules
 * for better log organization and filtering. Components help create hierarchical
 * logging structures that mirror your application architecture.
 */

import fjellLogging from '@fjell/logging';

const { getLogger } = fjellLogging;

console.log('=== Component-Based Logging Example ===\n');

// Main application logger
const appLogger = getLogger('my-app');

// Create component-specific loggers
const dbLogger = appLogger.get('database');
const authLogger = appLogger.get('auth');
const apiLogger = appLogger.get('api');

// Multi-level component hierarchies
const userDbLogger = dbLogger.get('users');
const orderDbLogger = dbLogger.get('orders');
const authMiddleware = authLogger.get('middleware');
const authService = authLogger.get('service');
const v1ApiLogger = apiLogger.get('v1');
const v2ApiLogger = apiLogger.get('v2');

console.log('=== Database Operations ===\n');

// Database component logging
dbLogger.info('Database connection pool initialized', {
  poolSize: 10,
  maxConnections: 50,
  database: 'production'
});

userDbLogger.debug('User query executed', {
  query: 'SELECT * FROM users WHERE active = true',
  executionTime: '15ms',
  rowsReturned: 1247
});

orderDbLogger.info('Order created successfully', {
  orderId: 'order-12345',
  customerId: 'cust-67890',
  amount: '$129.99',
  status: 'pending'
});

userDbLogger.warning('Slow query detected', {
  query: 'SELECT * FROM users u JOIN orders o ON u.id = o.user_id',
  executionTime: '2.3s',
  threshold: '1s'
});

console.log('\n=== Authentication System ===\n');

// Authentication component logging
authLogger.info('Authentication system started');

authMiddleware.debug('JWT token validation started', {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  endpoint: '/api/protected'
});

authService.info('User login successful', {
  userId: 'user-12345',
  email: 'john@example.com',
  loginMethod: 'password',
  ipAddress: '192.168.1.100'
});

authMiddleware.warning('Failed login attempt', {
  email: 'hacker@suspicious.com',
  ipAddress: '203.0.113.42',
  reason: 'Invalid password',
  attempts: 5
});

authService.error('Token refresh failed', {
  userId: 'user-67890',
  error: 'Token expired',
  lastRefresh: '2024-01-15T08:30:00Z'
});

console.log('\n=== API Layer ===\n');

// API component logging
apiLogger.info('API server started', {
  port: 3000,
  environment: 'production',
  version: '2.1.0'
});

v1ApiLogger.notice('Deprecated endpoint accessed', {
  endpoint: '/api/v1/users',
  clientId: 'mobile-app-v1.0',
  deprecationDate: '2024-06-01',
  migrationUrl: '/api/v2/users'
});

v2ApiLogger.info('New API endpoint called', {
  endpoint: '/api/v2/users',
  method: 'GET',
  responseTime: '45ms',
  statusCode: 200
});

v1ApiLogger.warning('Rate limit approaching', {
  clientId: 'web-app',
  currentRequests: 450,
  limit: 500,
  timeWindow: '1 hour'
});

console.log('\n=== Multi-Component Operations ===\n');

// Simulate a multi-component operation
const processOrder = async (orderId: string) => {
  const orderLogger = appLogger.get('order-processor');

  orderLogger.info('Starting order processing', { orderId });

  // Database operation
  const dbOpLogger = orderLogger.get('database');
  dbOpLogger.debug('Fetching order details', { orderId });

  // Payment processing
  const paymentLogger = orderLogger.get('payment');
  paymentLogger.info('Processing payment', {
    orderId,
    amount: '$99.99',
    gateway: 'stripe'
  });

  // Inventory check
  const inventoryLogger = orderLogger.get('inventory');
  inventoryLogger.debug('Checking inventory', {
    orderId,
    items: ['item-123', 'item-456']
  });

  // Shipping
  const shippingLogger = orderLogger.get('shipping');
  shippingLogger.info('Creating shipping label', {
    orderId,
    carrier: 'ups',
    trackingNumber: '1Z999AA1234567890'
  });

  orderLogger.info('Order processing completed', {
    orderId,
    status: 'shipped',
    processingTime: '2.3s'
  });
};

// Execute the multi-component operation
await processOrder('order-78901');

console.log('\n=== Component Hierarchy Benefits ===\n');
console.log('Component-based logging provides several benefits:');
console.log('1. **Organization**: Group related logs together');
console.log('2. **Filtering**: Enable/disable logging for specific components');
console.log('3. **Context**: Clear indication of which system component generated the log');
console.log('4. **Hierarchy**: Natural nesting that mirrors your application structure');
console.log('5. **Configuration**: Set different log levels per component');

console.log('\n=== Configuration Example ===\n');
console.log('You can configure different log levels for different components:');
console.log('```json');
console.log('{');
console.log('  "logLevel": "INFO",');
console.log('  "overrides": {');
console.log('    "my-app.database": { "logLevel": "DEBUG" },');
console.log('    "my-app.auth": { "logLevel": "WARNING" },');
console.log('    "my-app.api.v1": { "logLevel": "ERROR" }');
console.log('  }');
console.log('}');
console.log('```');

console.log('\n=== End of Component-Based Logging Example ===');
