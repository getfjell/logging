This directory contains examples demonstrating how to use the `@fjell/logging` library. The fjell logging library provides structured, configurable logging with features like flood control, component-based organization, and environment-based configuration.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Log Levels](#log-levels)
- [Configuration](#configuration)
- [Component-Based Logging](#component-based-logging)
- [Time Logging](#time-logging)
- [Flood Control](#flood-control)
- [Environment Variables](#environment-variables)

## Installation

```bash
npm install @fjell/logging
# or
npm install @fjell/logging
```

## Basic Usage

The simplest way to use fjell-logging is to get a logger instance and start logging:

```typescript
import { getLogger } from '@fjell/logging';

const logger = getLogger('my-app');

logger.info('Hello, world!');
logger.error('Something went wrong!', { errorCode: 500 });
```

See [basic-usage.ts](./basic-usage.ts) for a complete example.

## Log Levels

The library supports multiple log levels with numeric values for filtering:

- `EMERGENCY` (0) - System is unusable
- `ALERT` (1) - Action must be taken immediately
- `CRITICAL` (2) - Critical conditions
- `ERROR` (3) - Error conditions
- `WARNING` (4) - Warning conditions
- `NOTICE` (5) - Normal but significant condition
- `INFO` (6) - Informational messages
- `DEBUG` (7) - Debug-level messages
- `DEFAULT` (8) - Default level messages

See [log-levels.ts](./log-levels.ts) for examples of all log levels.

## Configuration

Configure logging through environment variables or programmatic configuration:

### Environment Variables

```bash
# Set global log level
LOG_LEVEL=DEBUG

# Set log format
LOG_FORMAT=STRUCTURED

# Full JSON configuration
LOGGING_CONFIG='{"logLevel":"INFO","logFormat":"TEXT","overrides":{"database":{"logLevel":"DEBUG"}},"floodControl":{"enabled":true,"threshold":5,"timeframe":1000}}'
```

See [configuration.ts](./configuration.ts) for configuration examples.

## Component-Based Logging

Organize your logs by components for better structure:

```typescript
const logger = getLogger('my-app');
const dbLogger = logger.get('database');
const authLogger = logger.get('auth', 'middleware');

dbLogger.info('Database connected');
authLogger.warning('Failed login attempt');
```

See [component-logging.ts](./component-logging.ts) for detailed examples.

## Time Logging

Measure execution time for operations:

```typescript
const logger = getLogger('performance');
const timer = logger.time('api-call');

// ... perform operation
await someAsyncOperation();

timer.end(); // Logs the duration
```

See [time-logging.ts](./time-logging.ts) for time logging examples.

## Flood Control

Prevent log flooding with built-in flood control:

```typescript
// Configure flood control to suppress repeated messages
const config = {
  floodControl: {
    enabled: true,
    threshold: 5,      // Max 5 identical messages
    timeframe: 1000    // Within 1 second
  }
};
```

See [flood-control.ts](./flood-control.ts) for flood control examples.

## Available Examples

| File | Description |
|------|-------------|
| [basic-usage.ts](./basic-usage.ts) | Simple logging examples |
| [log-levels.ts](./log-levels.ts) | Demonstrates all log levels |
| [configuration.ts](./configuration.ts) | Environment and programmatic configuration |
| [component-logging.ts](./component-logging.ts) | Organizing logs by components |
| [time-logging.ts](./time-logging.ts) | Measuring execution time |
| [flood-control.ts](./flood-control.ts) | Preventing log flooding |
| [advanced-usage.ts](./advanced-usage.ts) | Advanced patterns and best practices |

## Running Examples

Each example can be run directly with Node.js:

```bash
# Install dependencies
npm install

# Run an example
npx tsx examples/basic-usage.ts

# Or with specific environment variables
LOG_LEVEL=DEBUG npx tsx examples/log-levels.ts
```

## Best Practices

1. **Use descriptive logger names**: Choose names that reflect the component or module
2. **Include context data**: Pass relevant objects and data with your log messages
3. **Use appropriate log levels**: Choose the right level for your message severity
4. **Enable flood control in production**: Prevent log spam from overwhelming your system
5. **Configure per-component levels**: Use overrides to control verbosity per component
6. **Use structured logging**: Enable structured format for better log parsing

## Format Examples

### Text Format (Default)
```
[INFO] [my-app] Hello, world!
[ERROR] [my-app] Something went wrong! {"errorCode":500}
```

### Structured Format
```json
{"level":"INFO","category":"my-app","components":[],"message":"Hello, world!","timestamp":"2024-01-15T10:30:00.000Z"}
{"level":"ERROR","category":"my-app","components":[],"message":"Something went wrong!","data":[{"errorCode":500}],"timestamp":"2024-01-15T10:30:01.000Z"}
```
