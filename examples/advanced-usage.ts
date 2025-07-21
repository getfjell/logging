/**
 * Advanced Usage Example for @fjell/logging
 *
 * This example demonstrates advanced patterns and best practices for using
 * fjell-logging in production applications, including:
 * - Structured logging patterns
 * - Error tracking and correlation
 * - Performance monitoring
 * - Context propagation
 * - Integration patterns
 */

import fjellLogging from '@fjell/logging';

const { getLogger } = fjellLogging;

console.log('=== Advanced Usage Patterns for @fjell/logging ===\n');

// Helper function to simulate async operations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate correlation IDs for request tracking
const generateCorrelationId = () => `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

console.log('=== Request Correlation and Context Propagation ===\n');

// Simulate a web request handler with correlation ID
const handleWebRequest = async (endpoint: string, method: string) => {
  const correlationId = generateCorrelationId();
  const requestLogger = getLogger('web-api').get('request-handler');

  // Start request with correlation context
  requestLogger.info('Request started', {
    correlationId,
    endpoint,
    method,
    timestamp: new Date().toISOString(),
    userAgent: 'Mozilla/5.0 (Example Browser)',
    clientIp: '192.168.1.100'
  });

  try {
    // Simulate authentication
    await simulateAuthentication(correlationId);

    // Simulate business logic
    await simulateBusinessLogic(correlationId, endpoint);

    // Simulate response
    const responseTime = Math.floor(Math.random() * 200) + 50;
    requestLogger.info('Request completed successfully', {
      correlationId,
      endpoint,
      method,
      statusCode: 200,
      responseTime,
      contentType: 'application/json'
    });

  } catch (error) {
    requestLogger.error('Request failed', {
      correlationId,
      endpoint,
      method,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      statusCode: 500
    });
  }
};

const simulateAuthentication = async (correlationId: string) => {
  const authLogger = getLogger('web-api').get('authentication');

  authLogger.debug('Starting authentication', { correlationId });

  await delay(20);

  // Simulate occasional auth failures
  if (Math.random() < 0.1) {
    authLogger.warning('Authentication failed', {
      correlationId,
      reason: 'Invalid token',
      authMethod: 'JWT'
    });
    throw new Error('Authentication failed');
  }

  authLogger.debug('Authentication successful', {
    correlationId,
    userId: 'user-12345',
    authMethod: 'JWT'
  });
};

const simulateBusinessLogic = async (correlationId: string, endpoint: string) => {
  const businessLogger = getLogger('web-api').get('business-logic');

  businessLogger.debug('Processing business logic', { correlationId, endpoint });

  // Simulate database operations
  await simulateDatabaseOperations(correlationId);

  // Simulate external API calls
  if (endpoint.includes('payment')) {
    await simulateExternalApiCall(correlationId, 'payment-gateway');
  }

  await delay(50);

  businessLogger.debug('Business logic completed', { correlationId, endpoint });
};

const simulateDatabaseOperations = async (correlationId: string) => {
  const dbLogger = getLogger('web-api').get('database');

  const operations = [
    { table: 'users', operation: 'SELECT', duration: 15 },
    { table: 'orders', operation: 'INSERT', duration: 25 },
    { table: 'audit_log', operation: 'INSERT', duration: 10 }
  ];

  for (const op of operations) {
    const timer = dbLogger.time('db-operation');

    timer.log('Executing database operation', {
      correlationId,
      table: op.table,
      operation: op.operation,
      query: `${op.operation} FROM ${op.table}`
    });

    await delay(op.duration);

    timer.end();

    dbLogger.debug('Database operation completed', {
      correlationId,
      table: op.table,
      operation: op.operation,
      rowsAffected: Math.floor(Math.random() * 100) + 1
    });
  }
};

const simulateExternalApiCall = async (correlationId: string, service: string) => {
  const externalLogger = getLogger('web-api').get('external-services');

  const timer = externalLogger.time('external-api-call');

  timer.log('Calling external service', {
    correlationId,
    service,
    endpoint: `https://api.${service}.com/process`,
    timeout: '30s'
  });

  try {
    await delay(150);

    // Simulate occasional external service failures
    if (Math.random() < 0.05) {
      throw new Error('External service timeout');
    }

    timer.end();

    externalLogger.info('External service call successful', {
      correlationId,
      service,
      responseCode: 200,
      processingTime: '150ms'
    });

  } catch (error) {
    timer.end();

    externalLogger.error('External service call failed', {
      correlationId,
      service,
      error: error instanceof Error ? error.message : 'Unknown error',
      retryable: true
    });

    throw error;
  }
};

// Execute several requests
console.log('Simulating multiple web requests...\n');
await Promise.all([
  handleWebRequest('/api/users', 'GET'),
  handleWebRequest('/api/orders', 'POST'),
  handleWebRequest('/api/payment/process', 'POST'),
  handleWebRequest('/api/profile', 'GET')
]);

console.log('\n=== Structured Error Tracking ===\n');

const errorTrackingExample = async () => {
  const errorLogger = getLogger('error-tracking');

  // Define error categories and tracking
  const trackError = (error: Error, context: any, severity: 'low' | 'medium' | 'high' | 'critical') => {
    const errorId = `err-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    errorLogger.error('Application error occurred', {
      errorId,
      severity,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      },
      context,
      environment: process.env.NODE_ENV || 'development',
      version: '1.2.3',
      timestamp: new Date().toISOString(),
      tags: ['error-tracking', severity, context.component]
    });

    return errorId;
  };

  // Simulate various error scenarios
  try {
    throw new TypeError('Invalid argument type');
  } catch (error) {
    trackError(error as Error, {
      component: 'user-service',
      function: 'validateUser',
      userId: 'user-123',
      inputData: { email: null }
    }, 'medium');
  }

  try {
    throw new ReferenceError('Variable not defined');
  } catch (error) {
    trackError(error as Error, {
      component: 'order-processor',
      function: 'calculateTotal',
      orderId: 'order-456'
    }, 'high');
  }

  try {
    throw new Error('Database connection lost');
  } catch (error) {
    trackError(error as Error, {
      component: 'database-pool',
      function: 'getConnection',
      poolSize: 10,
      activeConnections: 8
    }, 'critical');
  }
};

await errorTrackingExample();

console.log('\n=== Performance Monitoring Patterns ===\n');

const performanceMonitoringExample = async () => {
  const perfLogger = getLogger('performance-monitoring');

  // Custom performance tracking class
  class PerformanceTracker {
    private metrics: Map<string, number[]> = new Map();

    track(operation: string, duration: number, context?: any) {
      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, []);
      }

      this.metrics.get(operation)!.push(duration);

      perfLogger.info('Performance metric recorded', {
        operation,
        duration,
        unit: 'ms',
        context,
        timestamp: new Date().toISOString()
      });

      // Check for performance thresholds
      if (duration > 1000) {
        perfLogger.warning('Slow operation detected', {
          operation,
          duration,
          threshold: 1000,
          context
        });
      }
    }

    getStats(operation: string) {
      const durations = this.metrics.get(operation) || [];
      if (durations.length === 0) return null;

      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);

      return { avg, min, max, count: durations.length };
    }

    logSummary() {
      perfLogger.info('Performance summary', {
        operations: Array.from(this.metrics.keys()).map(op => ({
          operation: op,
          stats: this.getStats(op)
        }))
      });
    }
  }

  const tracker = new PerformanceTracker();

  // Simulate various operations with performance tracking
  const operations = [
    { name: 'user-lookup', baseTime: 50 },
    { name: 'order-calculation', baseTime: 100 },
    { name: 'payment-processing', baseTime: 200 },
    { name: 'notification-send', baseTime: 75 }
  ];

  for (let i = 0; i < 10; i++) {
    for (const op of operations) {
      const timer = perfLogger.time(op.name);

      // Simulate variable execution time
      const duration = op.baseTime + Math.random() * 100;
      await delay(duration);

      timer.end();
      tracker.track(op.name, duration, { iteration: i + 1 });
    }
  }

  // Log performance summary
  tracker.logSummary();
};

await performanceMonitoringExample();

console.log('\n=== Health Check and System Monitoring ===\n');

const healthCheckExample = async () => {
  const healthLogger = getLogger('health-monitoring');

  const checkSystemHealth = async () => {
    const checks = [
      { name: 'database', healthy: Math.random() > 0.1 },
      { name: 'redis', healthy: Math.random() > 0.05 },
      { name: 'external-api', healthy: Math.random() > 0.15 },
      { name: 'file-system', healthy: Math.random() > 0.02 }
    ];

    const results: Array<{
      component: string;
      healthy: boolean;
      timestamp: string;
      responseTime: number;
    }> = [];
    let overallHealthy = true;

    for (const check of checks) {
      const timer = healthLogger.time('health-check');

      timer.log('Starting health check', { component: check.name });

      await delay(Math.random() * 50 + 10);

      timer.end();

      const result = {
        component: check.name,
        healthy: check.healthy,
        timestamp: new Date().toISOString(),
        responseTime: Math.floor(Math.random() * 50) + 10
      };

      results.push(result);

      if (check.healthy) {
        healthLogger.debug('Health check passed', result);
      } else {
        healthLogger.warning('Health check failed', result);
        overallHealthy = false;
      }
    }

    // Log overall system health
    if (overallHealthy) {
      healthLogger.info('System health check: ALL SYSTEMS OPERATIONAL', {
        overallStatus: 'healthy',
        components: results,
        checkDuration: '200ms'
      });
    } else {
      healthLogger.error('System health check: DEGRADED PERFORMANCE', {
        overallStatus: 'unhealthy',
        components: results,
        failedComponents: results.filter(r => !r.healthy).map(r => r.component),
        checkDuration: '200ms'
      });
    }
  };

  // Run health checks multiple times
  for (let i = 0; i < 3; i++) {
    await checkSystemHealth();
    await delay(1000);
  }
};

await healthCheckExample();

console.log('\n=== Best Practices Demonstrated ===\n');

console.log('This example demonstrates several advanced patterns:');
console.log('');
console.log('1. **Correlation ID Propagation**:');
console.log('   - Generate unique IDs for request tracking');
console.log('   - Pass correlation IDs through all related operations');
console.log('   - Enable distributed tracing across services');
console.log('');
console.log('2. **Structured Error Tracking**:');
console.log('   - Standardized error logging format');
console.log('   - Error categorization and severity levels');
console.log('   - Context preservation for debugging');
console.log('');
console.log('3. **Performance Monitoring**:');
console.log('   - Consistent timing patterns');
console.log('   - Threshold-based alerting');
console.log('   - Statistical analysis of operations');
console.log('');
console.log('4. **Component Organization**:');
console.log('   - Hierarchical logger structure');
console.log('   - Clear separation of concerns');
console.log('   - Consistent naming conventions');
console.log('');
console.log('5. **Context-Rich Logging**:');
console.log('   - Comprehensive metadata inclusion');
console.log('   - Structured data for analysis');
console.log('   - Environment and version tracking');

console.log('\n=== Integration with External Systems ===\n');

console.log('For production deployments, consider integrating with:');
console.log('');
console.log('**Log Aggregation**:');
console.log('- ELK Stack (Elasticsearch, Logstash, Kibana)');
console.log('- Splunk');
console.log('- Datadog');
console.log('- New Relic');
console.log('');
console.log('**Monitoring & Alerting**:');
console.log('- Prometheus + Grafana');
console.log('- CloudWatch');
console.log('- PagerDuty integration');
console.log('');
console.log('**Error Tracking**:');
console.log('- Sentry');
console.log('- Bugsnag');
console.log('- Rollbar');

console.log('\n=== Production Deployment Checklist ===\n');

console.log('✅ **Configuration**:');
console.log('   - Set appropriate log levels per environment');
console.log('   - Enable structured logging in production');
console.log('   - Configure flood control for high-traffic scenarios');
console.log('   - Set component-specific log levels');
console.log('');
console.log('✅ **Monitoring**:');
console.log('   - Implement correlation ID propagation');
console.log('   - Set up performance monitoring');
console.log('   - Configure health checks');
console.log('   - Establish error tracking patterns');
console.log('');
console.log('✅ **Operations**:');
console.log('   - Set up log rotation');
console.log('   - Configure alerting thresholds');
console.log('   - Implement log aggregation');
console.log('   - Plan for log retention');

console.log('\n=== End of Advanced Usage Example ===');
