/**
 * Time Logging Example for @fjell/logging
 *
 * This example demonstrates how to use the time logging feature to measure
 * execution time for operations. Time logging is useful for performance
 * monitoring and identifying bottlenecks in your application.
 */

import fjellLogging from '@fjell/logging';

const { getLogger } = fjellLogging;

console.log('=== Time Logging Example ===\n');

const performanceLogger = getLogger('performance');

// Helper function to simulate async operations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

console.log('=== Basic Time Logging ===\n');

// Basic time logging
const basicTimer = performanceLogger.time('basic-operation');

// Simulate some work
await delay(100);

// End the timer and log the duration
basicTimer.end();

console.log('\n=== Database Operation Timing ===\n');

// Simulate database operations with timing
const simulateDbQuery = async (query: string, expectedTime: number) => {
  const dbLogger = performanceLogger.get('database');
  const timer = dbLogger.time('query-execution');

  // Add context to the timer
  timer.log('Executing query', {
    query,
    estimatedTime: `${expectedTime}ms`
  });

  // Simulate query execution
  await delay(expectedTime);

  // Timer automatically logs duration when ended
  timer.end();

  return { rowsAffected: Math.floor(Math.random() * 1000) };
};

await simulateDbQuery('SELECT * FROM users WHERE active = true', 50);
await simulateDbQuery('SELECT o.*, u.name FROM orders o JOIN users u ON o.user_id = u.id', 150);
await simulateDbQuery('UPDATE user_preferences SET theme = ? WHERE user_id = ?', 25);

console.log('\n=== API Endpoint Timing ===\n');

// Simulate API endpoint timing
const simulateApiEndpoint = async (endpoint: string, processingTime: number) => {
  const apiLogger = performanceLogger.get('api');
  const requestTimer = apiLogger.time('request-processing');

  requestTimer.log('Processing API request', {
    endpoint,
    method: 'POST',
    contentType: 'application/json'
  });

  // Simulate different phases of request processing
  const authTimer = apiLogger.time('authentication');
  await delay(10);
  authTimer.end();

  const validationTimer = apiLogger.time('validation');
  await delay(15);
  validationTimer.end();

  const businessLogicTimer = apiLogger.time('business-logic');
  await delay(processingTime);
  businessLogicTimer.end();

  const responseTimer = apiLogger.time('response-serialization');
  await delay(5);
  responseTimer.end();

  requestTimer.end();

  return { statusCode: 200, success: true };
};

await simulateApiEndpoint('/api/users', 80);
await simulateApiEndpoint('/api/orders', 120);

console.log('\n=== Nested Operation Timing ===\n');

// Complex operation with nested timers
const processOrderWithTiming = async (orderId: string) => {
  const orderLogger = performanceLogger.get('order-processing');
  const overallTimer = orderLogger.time('complete-order-processing');

  overallTimer.log('Starting order processing', { orderId });

  // Phase 1: Validation
  const validationTimer = orderLogger.time('order-validation');
  validationTimer.log('Validating order details', { orderId });
  await delay(30);
  validationTimer.end();

  // Phase 2: Payment processing
  const paymentTimer = orderLogger.time('payment-processing');
  paymentTimer.log('Processing payment', {
    orderId,
    gateway: 'stripe',
    amount: '$129.99'
  });
  await delay(200);
  paymentTimer.end();

  // Phase 3: Inventory update
  const inventoryTimer = orderLogger.time('inventory-update');
  inventoryTimer.log('Updating inventory', {
    orderId,
    items: ['item-123', 'item-456']
  });
  await delay(50);
  inventoryTimer.end();

  // Phase 4: Notification sending
  const notificationTimer = orderLogger.time('notification-sending');
  notificationTimer.log('Sending confirmation notifications', { orderId });
  await delay(75);
  notificationTimer.end();

  overallTimer.log('Order processing completed successfully', {
    orderId,
    status: 'completed'
  });
  overallTimer.end();

  return { success: true, orderId };
};

await processOrderWithTiming('order-12345');

console.log('\n=== Batch Operation Timing ===\n');

// Time multiple similar operations
const processBatchWithTiming = async (items: string[]) => {
  const batchLogger = performanceLogger.get('batch-processor');
  const batchTimer = batchLogger.time('batch-processing');

  batchTimer.log('Starting batch processing', {
    itemCount: items.length,
    batchId: 'batch-001'
  });

  for (let i = 0; i < items.length; i++) {
    const itemTimer = batchLogger.time('item-processing');
    itemTimer.log('Processing item', {
      item: items[i],
      position: i + 1,
      total: items.length
    });

    // Simulate processing time (varies per item)
    await delay(Math.random() * 100 + 50);

    itemTimer.end();
  }

  batchTimer.log('Batch processing completed', {
    itemCount: items.length,
    batchId: 'batch-001'
  });
  batchTimer.end();
};

await processBatchWithTiming(['item-1', 'item-2', 'item-3', 'item-4', 'item-5']);

console.log('\n=== Error Handling with Timers ===\n');

// Demonstrate timer usage with error handling
const operationWithErrorHandling = async (shouldFail: boolean) => {
  const errorLogger = performanceLogger.get('error-handling');
  const operationTimer = errorLogger.time('risky-operation');

  try {
    operationTimer.log('Starting risky operation', { shouldFail });

    await delay(100);

    if (shouldFail) {
      throw new Error('Simulated operation failure');
    }

    operationTimer.log('Operation completed successfully');
    operationTimer.end();

  } catch (error) {
    operationTimer.log('Operation failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    operationTimer.end(); // Still measure time even on failure

    errorLogger.error('Operation failed after timing', {
      error: error instanceof Error ? error.message : 'Unknown error',
      operationDuration: 'measured by timer'
    });
  }
};

await operationWithErrorHandling(false); // Success case
await operationWithErrorHandling(true);  // Failure case

console.log('\n=== Time Logging Best Practices ===\n');
console.log('1. **Always call timer.end()**: Even in error cases, call end() to measure total time');
console.log('2. **Add context with timer.log()**: Provide additional information during the operation');
console.log('3. **Use descriptive timer names**: Choose names that clearly indicate what is being measured');
console.log('4. **Nest timers for detailed analysis**: Break down complex operations into phases');
console.log('5. **Measure consistently**: Use timing for similar operations to identify patterns');
console.log('6. **Consider overhead**: Timer operations have minimal but non-zero performance impact');

console.log('\n=== Timer Output Format ===\n');
console.log('Timers automatically log duration when end() is called:');
console.log('- Duration is measured from timer creation to end() call');
console.log('- Output includes the timer name and measured duration');
console.log('- Additional context from timer.log() calls is included');
console.log('- Format: [LEVEL] [component] Timer: <name> completed in <duration>ms');

console.log('\n=== End of Time Logging Example ===');
