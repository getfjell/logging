/**
 * Configuration Example for @fjell/logging
 *
 * This example demonstrates various ways to configure the fjell-logging library:
 * - Environment variables
 * - JSON configuration
 * - Component-specific overrides
 * - Format options
 *
 * Try running with different configurations:
 * LOG_LEVEL=DEBUG npx tsx examples/configuration.ts
 * LOG_FORMAT=STRUCTURED npx tsx examples/configuration.ts
 * LOGGING_CONFIG='{"logLevel":"WARNING","logFormat":"STRUCTURED"}' npx tsx examples/configuration.ts
 */

import fjellLogging from '@fjell/logging';

const { getLogger } = fjellLogging;

console.log('=== Configuration Examples for @fjell/logging ===\n');

// Display current environment configuration
console.log('=== Current Environment Configuration ===\n');
console.log(`LOG_LEVEL: ${process.env.LOG_LEVEL || 'not set (defaults to INFO)'}`);
console.log(`LOG_FORMAT: ${process.env.LOG_FORMAT || 'not set (defaults to TEXT)'}`);
console.log(`LOGGING_CONFIG: ${process.env.LOGGING_CONFIG || 'not set'}`);
console.log(`EXPO_PUBLIC_LOGGING_CONFIG: ${process.env.EXPO_PUBLIC_LOGGING_CONFIG || 'not set'}`);
console.log(`NEXT_PUBLIC_LOGGING_CONFIG: ${process.env.NEXT_PUBLIC_LOGGING_CONFIG || 'not set'}`);

console.log('\n=== Basic Environment Variable Configuration ===\n');

const configLogger = getLogger('config-demo');

// Demonstrate logging at different levels to show current configuration
configLogger.emergency('Emergency message - always shown');
configLogger.alert('Alert message - shown if LOG_LEVEL >= ALERT');
configLogger.critical('Critical message - shown if LOG_LEVEL >= CRITICAL');
configLogger.error('Error message - shown if LOG_LEVEL >= ERROR');
configLogger.warning('Warning message - shown if LOG_LEVEL >= WARNING');
configLogger.notice('Notice message - shown if LOG_LEVEL >= NOTICE');
configLogger.info('Info message - shown if LOG_LEVEL >= INFO (default)');
configLogger.debug('Debug message - shown if LOG_LEVEL >= DEBUG');
configLogger.default('Default message - shown if LOG_LEVEL >= DEFAULT');

console.log('\n=== Environment Variable Examples ===\n');

console.log('Single environment variable configuration:');
console.log('```bash');
console.log('# Set log level only');
console.log('export LOG_LEVEL=DEBUG');
console.log('npx tsx examples/configuration.ts');
console.log('');
console.log('# Set log format only');
console.log('export LOG_FORMAT=STRUCTURED');
console.log('npx tsx examples/configuration.ts');
console.log('');
console.log('# Combine both');
console.log('export LOG_LEVEL=WARNING');
console.log('export LOG_FORMAT=STRUCTURED');
console.log('npx tsx examples/configuration.ts');
console.log('```');

console.log('\n=== JSON Configuration Examples ===\n');

console.log('Complete JSON configuration via LOGGING_CONFIG:');
console.log('```bash');
console.log('export LOGGING_CONFIG=\'');
console.log('{');
console.log('  "logLevel": "DEBUG",');
console.log('  "logFormat": "STRUCTURED",');
console.log('  "floodControl": {');
console.log('    "enabled": true,');
console.log('    "threshold": 5,');
console.log('    "timeframe": 1000');
console.log('  },');
console.log('  "overrides": {');
console.log('    "config-demo.database": {');
console.log('      "logLevel": "ERROR"');
console.log('    },');
console.log('    "config-demo.api": {');
console.log('      "logLevel": "INFO"');
console.log('    }');
console.log('  }');
console.log('}\'');
console.log('npx tsx examples/configuration.ts');
console.log('```');

console.log('\n=== Component-Specific Configuration ===\n');

// Demonstrate component-specific logging
const dbLogger = configLogger.get('database');
const apiLogger = configLogger.get('api');
const authLogger = configLogger.get('auth');

console.log('Testing component-specific overrides...\n');

// These will respect component-specific log level overrides if configured
dbLogger.debug('Database debug message - may be suppressed by override');
dbLogger.info('Database info message');
dbLogger.warning('Database warning message');
dbLogger.error('Database error message');

apiLogger.debug('API debug message - may be suppressed by override');
apiLogger.info('API info message');
apiLogger.warning('API warning message');

authLogger.debug('Auth debug message');
authLogger.info('Auth info message');
authLogger.warning('Auth warning message');

console.log('\n=== Framework-Specific Configuration ===\n');

console.log('For Expo applications:');
console.log('```bash');
console.log('export EXPO_PUBLIC_LOGGING_CONFIG=\'{"logLevel":"INFO","logFormat":"TEXT"}\'');
console.log('```');

console.log('\nFor Next.js applications:');
console.log('```bash');
console.log('export NEXT_PUBLIC_LOGGING_CONFIG=\'{"logLevel":"INFO","logFormat":"TEXT"}\'');
console.log('```');

console.log('\nFor general Node.js applications:');
console.log('```bash');
console.log('export LOGGING_CONFIG=\'{"logLevel":"INFO","logFormat":"TEXT"}\'');
console.log('```');

console.log('\n=== Format Comparison ===\n');

const formatLogger = getLogger('format-comparison');

console.log('Current format output examples:');
console.log('(The actual format depends on your LOG_FORMAT setting)\n');

formatLogger.info('Simple info message');
formatLogger.warning('Warning with data', {
  userId: 'user-123',
  action: 'login',
  timestamp: new Date().toISOString()
});
formatLogger.error('Error with complex data', {
  error: {
    message: 'Connection failed',
    code: 'ECONNREFUSED',
    stack: 'Error: Connection failed\n    at connect (/app/db.js:45:12)'
  },
  context: {
    database: 'postgresql',
    host: 'localhost',
    port: 5432,
    retries: 3
  }
});

console.log('\n=== Configuration Priority ===\n');

console.log('Configuration is loaded in the following priority order:');
console.log('1. **Individual environment variables** (LOG_LEVEL, LOG_FORMAT) - highest priority');
console.log('2. **LOGGING_CONFIG** JSON configuration');
console.log('3. **Framework-specific variables** (EXPO_PUBLIC_LOGGING_CONFIG, NEXT_PUBLIC_LOGGING_CONFIG)');
console.log('4. **Default configuration** - lowest priority');
console.log('');
console.log('Later configurations override earlier ones, except for individual env vars.');

console.log('\n=== Production Configuration Examples ===\n');

console.log('Development environment:');
console.log('```bash');
console.log('export LOG_LEVEL=DEBUG');
console.log('export LOG_FORMAT=TEXT');
console.log('export LOGGING_CONFIG=\'{"floodControl":{"enabled":false}}\'');
console.log('```');

console.log('\nStaging environment:');
console.log('```bash');
console.log('export LOG_LEVEL=INFO');
console.log('export LOG_FORMAT=STRUCTURED');
console.log('export LOGGING_CONFIG=\'{"floodControl":{"enabled":true,"threshold":10,"timeframe":1000}}\'');
console.log('```');

console.log('\nProduction environment:');
console.log('```bash');
console.log('export LOG_LEVEL=WARNING');
console.log('export LOG_FORMAT=STRUCTURED');
console.log('export LOGGING_CONFIG=\'');
console.log('{');
console.log('  "floodControl": {');
console.log('    "enabled": true,');
console.log('    "threshold": 5,');
console.log('    "timeframe": 2000');
console.log('  },');
console.log('  "overrides": {');
console.log('    "payment-service": { "logLevel": "ERROR" },');
console.log('    "health-checker": { "logLevel": "CRITICAL" },');
console.log('    "audit-logger": { "logLevel": "INFO" }');
console.log('  }');
console.log('}\'');
console.log('```');

console.log('\n=== Docker Configuration ===\n');

console.log('In Docker containers, you can set environment variables:');
console.log('```dockerfile');
console.log('# In Dockerfile');
console.log('ENV LOG_LEVEL=INFO');
console.log('ENV LOG_FORMAT=STRUCTURED');
console.log('ENV LOGGING_CONFIG=\'{"floodControl":{"enabled":true}}\'');
console.log('```');

console.log('\nOr via docker-compose.yml:');
console.log('```yaml');
console.log('services:');
console.log('  app:');
console.log('    environment:');
console.log('      - LOG_LEVEL=INFO');
console.log('      - LOG_FORMAT=STRUCTURED');
console.log('      - LOGGING_CONFIG={"floodControl":{"enabled":true,"threshold":5}}');
console.log('```');

console.log('\n=== Kubernetes Configuration ===\n');

console.log('In Kubernetes, use ConfigMaps or environment variables:');
console.log('```yaml');
console.log('apiVersion: v1');
console.log('kind: ConfigMap');
console.log('metadata:');
console.log('  name: logging-config');
console.log('data:');
console.log('  LOG_LEVEL: "INFO"');
console.log('  LOG_FORMAT: "STRUCTURED"');
console.log('  LOGGING_CONFIG: |');
console.log('    {');
console.log('      "floodControl": {');
console.log('        "enabled": true,');
console.log('        "threshold": 5,');
console.log('        "timeframe": 1000');
console.log('      }');
console.log('    }');
console.log('```');

console.log('\n=== Testing Your Configuration ===\n');

console.log('To test different configurations:');
console.log('1. **Start with defaults**: Run without any environment variables');
console.log('2. **Test log levels**: Set LOG_LEVEL to different values and observe filtering');
console.log('3. **Test formats**: Compare TEXT vs STRUCTURED output');
console.log('4. **Test overrides**: Configure component-specific log levels');
console.log('5. **Test flood control**: Enable and trigger repeated messages');

console.log('\n=== Configuration Validation ===\n');

console.log('The library validates configuration and will:');
console.log('- Fall back to defaults for invalid values');
console.log('- Log warnings for unrecognized configuration options');
console.log('- Continue operating with partial configuration');
console.log('- Throw errors only for completely malformed JSON');

// Demonstrate the current effective configuration by testing visibility
console.log('\n=== Current Configuration Test ===\n');

const testLogger = getLogger('config-test');
const testLevels = [
  { level: 'emergency', message: 'Emergency test' },
  { level: 'alert', message: 'Alert test' },
  { level: 'critical', message: 'Critical test' },
  { level: 'error', message: 'Error test' },
  { level: 'warning', message: 'Warning test' },
  { level: 'notice', message: 'Notice test' },
  { level: 'info', message: 'Info test' },
  { level: 'debug', message: 'Debug test' },
  { level: 'default', message: 'Default test' }
];

console.log('Testing which log levels are currently visible:');
testLevels.forEach(({ level, message }) => {
  (testLogger as any)[level](`${message} - level: ${level.toUpperCase()}`);
});

console.log('\n=== End of Configuration Example ===');
