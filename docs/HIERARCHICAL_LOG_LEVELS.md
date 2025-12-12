# Hierarchical Log Level Configuration

The @fjell/logging package supports hierarchical log level configuration, allowing you to set different log levels for specific components within a package.

## Overview

When you have a package with multiple components, you might want some components to log more verbosely than others for debugging purposes. The hierarchical configuration allows you to:

- Set a base log level for the entire package
- Override log levels for specific components
- **Nest component configurations to unlimited depth for fine-grained control**
- Configure independent branches with different depths and log levels

**Tested and validated with up to 6 levels of nesting** - supports any real-world logging hierarchy!

## Usage

### Basic Configuration

```javascript
const config = {
  "logLevel": "INFO",
  "logFormat": "TEXT",
  "overrides": {
    "@fjell/cache": {
      "logLevel": "INFO"
    }
  }
};
```

### Component-Level Overrides

```javascript
const config = {
  "logLevel": "INFO",
  "overrides": {
    "@fjell/cache": {
      "logLevel": "INFO",
      "components": {
        "CacheWarmer": { "logLevel": "DEBUG" },
        "TwoLayerCache": { "logLevel": "WARNING" }
      }
    }
  }
};
```

In this example:
- The `@fjell/cache` package has a base log level of INFO
- The `CacheWarmer` component within `@fjell/cache` logs at DEBUG level
- The `TwoLayerCache` component logs at WARNING level
- Other components in `@fjell/cache` use the base INFO level

### Deeply Nested Components

```javascript
const config = {
  "logLevel": "INFO",
  "overrides": {
    "@fjell/cache": {
      "logLevel": "WARNING",
      "components": {
        "CacheWarmer": {
          "logLevel": "INFO",
          "components": {
            "Strategy": {
              "logLevel": "DEBUG",
              "components": {
                "LRU": { "logLevel": "TRACE" }
              }
            }
          }
        }
      }
    }
  }
};
```

In this example:
- `@fjell/cache` base: WARNING
- `@fjell/cache/CacheWarmer`: INFO
- `@fjell/cache/CacheWarmer/Strategy`: DEBUG
- `@fjell/cache/CacheWarmer/Strategy/LRU`: TRACE

## Code Example

### Setting Up Loggers

```typescript
import { getLogger } from '@fjell/logging';

// Base logger for the package
const baseLogger = getLogger('@fjell/cache');

// Component-specific logger
const cacheWarmerLogger = baseLogger.get('CacheWarmer');

// Nested component logger
const strategyLogger = cacheWarmerLogger.get('Strategy');
const lruLogger = strategyLogger.get('LRU');
```

### Configuring via Environment Variable

```bash
export LOGGING_CONFIG='{
  "logLevel": "INFO",
  "overrides": {
    "@fjell/cache": {
      "logLevel": "INFO",
      "components": {
        "CacheWarmer": { "logLevel": "DEBUG" }
      }
    }
  }
}'
```

## Real-World Example

Here's a practical example for debugging a cache warming issue:

```bash
export LOGGING_CONFIG='{
  "logLevel": "INFO",
  "logFormat": "TEXT",
  "overrides": {
    "@fjell/cache": {
      "logLevel": "INFO",
      "components": {
        "CacheWarmer": { "logLevel": "DEBUG" }
      }
    },
    "@fjell/lib": { "logLevel": "INFO" },
    "@fjell/express-router": { "logLevel": "INFO" }
  }
}'
```

In your code:

```typescript
// lib.ts
const LibLogger = getLogger('@fjell/cache');

// CacheWarmer.ts
const logger = LibLogger.get('CacheWarmer');

logger.debug('Starting cache warm-up'); // Will log (DEBUG level)
logger.info('Cache warmed successfully'); // Will log (INFO level)

LibLogger.debug('Base cache debug'); // Won't log (base is INFO)
LibLogger.info('Base cache info'); // Will log (INFO level)
```

## Log Level Hierarchy

Log levels from least to most verbose:
- EMERGENCY
- ALERT
- CRITICAL
- ERROR
- WARNING
- NOTICE
- INFO
- DEBUG
- TRACE
- DEFAULT

## Resolution Rules

1. If no override exists for a category, the global log level is used
2. If a category override exists but no component override, the category level is used
3. If a component override exists, it takes precedence
4. If a deeper component is requested but not configured, the parent level is used

## Type Safety

The configuration types are exported for TypeScript users:

```typescript
import { ComponentOverride, LoggingConfig } from '@fjell/logging';

const myConfig: LoggingConfig = {
  logLevel: LogLevel.INFO,
  logFormat: LogFormat.TEXT,
  overrides: {
    '@fjell/cache': {
      logLevel: LogLevel.INFO,
      components: {
        'CacheWarmer': { logLevel: LogLevel.DEBUG }
      }
    }
  },
  floodControl: { enabled: false, threshold: 10, timeframe: 1000 },
  masking: { enabled: true }
};
```

## API Reference

### `resolveLogLevel(config: LoggingConfig, category: string, components: string[]): LogLevel.Config`

Resolves the effective log level for a given category and component path.

```typescript
import { resolveLogLevel, configureLogging } from '@fjell/logging';
import * as LogLevel from '@fjell/logging/LogLevel';

const config = configureLogging();
const level = resolveLogLevel(config, '@fjell/cache', ['CacheWarmer']);

if (level === LogLevel.DEBUG) {
  console.log('CacheWarmer is in debug mode');
}
```

## Best Practices

1. **Start Broad**: Begin with a reasonable base log level (INFO or WARNING)
2. **Be Specific**: Only add component overrides for the specific components you're debugging
3. **Use Environment Variables**: Configure logging through environment variables for production
4. **Document Components**: Document the component hierarchy in your package for easier configuration
5. **Clean Up**: Remove debug-level component overrides when debugging is complete
