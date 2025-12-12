/**
 * Example: Hierarchical Log Level Configuration
 *
 * This example demonstrates how to use hierarchical log level configuration
 * to control logging verbosity at different levels of your application.
 */

// First, set the LOGGING_CONFIG environment variable before running your app:
//
// export LOGGING_CONFIG='{
//   "logLevel": "INFO",
//   "logFormat": "TEXT",
//   "overrides": {
//     "@fjell/cache": {
//       "logLevel": "INFO",
//       "components": {
//         "CacheWarmer": { "logLevel": "DEBUG" },
//         "TwoLayerCache": { "logLevel": "WARNING" }
//       }
//     },
//     "@fjell/express-router": { "logLevel": "INFO" },
//     "@fjell/lib": { "logLevel": "INFO" }
//   }
// }'

import { getLogger } from '@fjell/logging';

// Example 1: Package-level logger
const cacheLogger = getLogger('@fjell/cache');

cacheLogger.info('Cache initialized'); // Will log
cacheLogger.debug('Debug info about cache'); // Won't log (INFO level)

// Example 2: Component-level logger with DEBUG override
const cacheWarmerLogger = cacheLogger.get('CacheWarmer');

cacheWarmerLogger.info('Starting cache warm-up'); // Will log
cacheWarmerLogger.debug('Warming cache entry: user-123'); // Will log (DEBUG level override)
cacheWarmerLogger.trace('Detailed trace info'); // Won't log (still below DEBUG)

// Example 3: Different component with WARNING override
const twoLayerCacheLogger = cacheLogger.get('TwoLayerCache');

twoLayerCacheLogger.info('TwoLayerCache initialized'); // Won't log (WARNING level)
twoLayerCacheLogger.warning('Cache miss, falling back'); // Will log
twoLayerCacheLogger.error('Cache error occurred'); // Will log

// Example 4: Nested components
const strategyLogger = cacheWarmerLogger.get('Strategy');
const lruLogger = strategyLogger.get('LRU');

// These inherit the CacheWarmer's DEBUG level unless overridden
strategyLogger.debug('Executing eviction strategy'); // Will log
lruLogger.debug('LRU eviction triggered'); // Will log

// Example 5: Component without specific override inherits parent level
const otherComponentLogger = cacheLogger.get('OtherComponent');

otherComponentLogger.info('OtherComponent action'); // Will log (inherits INFO)
otherComponentLogger.debug('OtherComponent debug'); // Won't log (inherits INFO)

// Example 6: Multiple levels of nesting with different configs
// If you had this config:
// {
//   "@fjell/cache": {
//     "logLevel": "WARNING",
//     "components": {
//       "CacheWarmer": {
//         "logLevel": "INFO",
//         "components": {
//           "Strategy": {
//             "logLevel": "DEBUG",
//             "components": {
//               "LRU": { "logLevel": "TRACE" }
//             }
//           }
//         }
//       }
//     }
//   }
// }

const baseLogger = getLogger('@fjell/cache');
const warmerLogger = baseLogger.get('CacheWarmer');
const strategyLogger2 = warmerLogger.get('Strategy');
const lruLogger2 = strategyLogger2.get('LRU');

// Each would have progressively more verbose logging:
// baseLogger: WARNING (base level)
// warmerLogger: INFO (component override)
// strategyLogger2: DEBUG (nested component override)
// lruLogger2: TRACE (deeply nested component override)

// Demonstrate the different log levels at each hierarchy level
baseLogger.warning('Base logger warning'); // Will log (WARNING level)
warmerLogger.info('Warmer info message'); // Will log (INFO level)
strategyLogger2.debug('Strategy debug message'); // Will log (DEBUG level)
lruLogger2.trace('LRU trace message'); // Will log (TRACE level)

console.log('Example completed. Check the logs above to see the hierarchical configuration in action.');
