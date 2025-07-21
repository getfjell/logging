/**
 * Flood Control Example for @fjell/logging
 *
 * This example demonstrates the flood control feature which prevents log flooding
 * by suppressing repeated identical messages within a specified timeframe.
 *
 * Run with flood control enabled:
 * LOGGING_CONFIG='{"floodControl":{"enabled":true,"threshold":3,"timeframe":2000}}' npx tsx examples/flood-control.ts
 */

import fjellLogging from '@fjell/logging';

const { getLogger } = fjellLogging;

console.log('=== Flood Control Example ===\n');

// Helper function to simulate async operations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

console.log('Current flood control configuration:');
console.log('- Set via LOGGING_CONFIG environment variable');
console.log('- Example: {"floodControl":{"enabled":true,"threshold":3,"timeframe":2000}}');
console.log('- threshold: Maximum identical messages allowed');
console.log('- timeframe: Time window in milliseconds\n');

const floodLogger = getLogger('flood-control-demo');

console.log('=== Demonstrating Repeated Messages ===\n');

// Simulate repeated error messages (common in loops or retry scenarios)
const simulateRepeatedErrors = async () => {
  const errorLogger = floodLogger.get('error-simulator');

  console.log('Sending 10 identical error messages rapidly...\n');

  for (let i = 1; i <= 10; i++) {
    errorLogger.error('Database connection failed', {
      attempt: i,
      error: 'Connection timeout',
      host: 'localhost',
      port: 5432
    });

    // Small delay to show rapid succession
    await delay(50);
  }

  console.log('\nWithout flood control: All 10 messages would be logged');
  console.log('With flood control: Only threshold messages + summary logged\n');
};

await simulateRepeatedErrors();

console.log('=== Different Message Types ===\n');

// Show that different messages are not affected by flood control
const simulateDifferentMessages = async () => {
  const mixedLogger = floodLogger.get('mixed-messages');

  console.log('Sending different error messages (should not be suppressed)...\n');

  mixedLogger.error('Database connection failed', { host: 'db1' });
  mixedLogger.error('API endpoint timeout', { endpoint: '/api/users' });
  mixedLogger.error('Cache miss', { key: 'user:123' });
  mixedLogger.error('Database connection failed', { host: 'db1' }); // Duplicate
  mixedLogger.error('Validation error', { field: 'email' });
  mixedLogger.error('Database connection failed', { host: 'db1' }); // Duplicate

  console.log('Different messages are logged separately');
  console.log('Only identical messages (same message + data) are suppressed\n');
};

await simulateDifferentMessages();

console.log('=== Retry Loop Simulation ===\n');

// Simulate a common scenario where flood control is useful
const simulateRetryLoop = async () => {
  const retryLogger = floodLogger.get('retry-handler');

  console.log('Simulating a service with connection retries...\n');

  const connectToService = async (serviceName: string, maxRetries: number) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        retryLogger.info('Attempting to connect to service', {
          service: serviceName,
          attempt,
          maxRetries
        });

        // Simulate connection attempt
        await delay(100);

        // Simulate failure (always fails for demo)
        throw new Error('Connection refused');

      } catch (error) {
        retryLogger.error('Failed to connect to service', {
          service: serviceName,
          attempt,
          maxRetries,
          error: error instanceof Error ? error.message : 'Unknown error',
          nextRetryIn: attempt < maxRetries ? '1s' : 'N/A'
        });

        if (attempt < maxRetries) {
          await delay(200);
        }
      }
    }

    retryLogger.critical('Service connection failed after all retries', {
      service: serviceName,
      totalAttempts: maxRetries,
      status: 'giving up'
    });
  };

  await connectToService('payment-gateway', 8);
};

await simulateRetryLoop();

console.log('\n=== Periodic Task Simulation ===\n');

// Simulate periodic task with potential repeated warnings
const simulatePeriodicTask = async () => {
  const periodicLogger = floodLogger.get('periodic-task');

  console.log('Simulating a periodic health check task...\n');

  for (let cycle = 1; cycle <= 12; cycle++) {
    periodicLogger.debug('Starting health check cycle', { cycle });

    // Simulate checking multiple services
    const services = ['api', 'database', 'cache', 'queue'];

    for (const service of services) {
      // Simulate service status (some services consistently unhealthy)
      const isHealthy = service === 'database' ? false : Math.random() > 0.3;

      if (isHealthy) {
        periodicLogger.debug('Service health check passed', {
          service,
          cycle,
          responseTime: Math.floor(Math.random() * 100) + 10
        });
      } else {
        // This will trigger flood control for database service
        periodicLogger.warning('Service health check failed', {
          service,
          cycle,
          status: 'unhealthy',
          lastSuccess: '5 minutes ago'
        });
      }
    }

    periodicLogger.debug('Health check cycle completed', { cycle });

    // Short delay between cycles
    await delay(100);
  }
};

await simulatePeriodicTask();

console.log('\n=== Flood Control Configuration Examples ===\n');

console.log('Environment variable configuration:');
console.log('```bash');
console.log('# Enable flood control with 5 message threshold in 1 second');
console.log('export LOGGING_CONFIG=\'{"floodControl":{"enabled":true,"threshold":5,"timeframe":1000}}\'');
console.log('');
console.log('# Disable flood control');
console.log('export LOGGING_CONFIG=\'{"floodControl":{"enabled":false}}\'');
console.log('');
console.log('# Strict flood control (3 messages in 5 seconds)');
console.log('export LOGGING_CONFIG=\'{"floodControl":{"enabled":true,"threshold":3,"timeframe":5000}}\'');
console.log('```');

console.log('\nFull JSON configuration:');
console.log('```json');
console.log('{');
console.log('  "logLevel": "INFO",');
console.log('  "logFormat": "TEXT",');
console.log('  "floodControl": {');
console.log('    "enabled": true,');
console.log('    "threshold": 5,');
console.log('    "timeframe": 1000');
console.log('  },');
console.log('  "overrides": {');
console.log('    "flood-control-demo.retry-handler": {');
console.log('      "logLevel": "DEBUG"');
console.log('    }');
console.log('  }');
console.log('}');
console.log('```');

console.log('\n=== How Flood Control Works ===\n');
console.log('1. **Message Hashing**: Identical messages (text + data) are hashed together');
console.log('2. **Threshold Counting**: Each unique hash is tracked against the threshold');
console.log('3. **Time Windows**: Suppression is based on configurable time windows');
console.log('4. **Summary Logging**: After suppression period, a summary is logged');
console.log('5. **Automatic Cleanup**: Old entries are cleaned up to prevent memory leaks');

console.log('\n=== When to Use Flood Control ===\n');
console.log('✅ **Good for**:');
console.log('   - Retry loops and connection attempts');
console.log('   - Periodic health checks and monitoring');
console.log('   - Error conditions that might repeat rapidly');
console.log('   - Background tasks with potential repeated warnings');
console.log('');
console.log('❌ **Not ideal for**:');
console.log('   - Critical error messages that should always be logged');
console.log('   - Messages with important unique context data');
console.log('   - Low-frequency logging scenarios');
console.log('   - Debug logging in development environments');

console.log('\n=== Testing Flood Control ===\n');
console.log('To test flood control with this example:');
console.log('1. Run without flood control (default)');
console.log('2. Run with flood control enabled');
console.log('3. Compare the output to see suppressed messages');
console.log('4. Adjust threshold and timeframe values');

console.log('\n=== End of Flood Control Example ===');
