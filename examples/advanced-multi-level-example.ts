/**
 * Advanced Multi-Level Hierarchical Configuration Example
 *
 * This example demonstrates the full power of hierarchical log level configuration
 * with multiple levels of nesting, multiple branches, and complex scenarios.
 */

import { getLogger } from '@fjell/logging';

// ============================================================================
// CONFIGURATION (set via environment variable before running)
// ============================================================================

// export LOGGING_CONFIG='{
//   "logLevel": "INFO",
//   "logFormat": "TEXT",
//   "overrides": {
//     "@fjell/cache": {
//       "logLevel": "INFO",
//       "components": {
//         "CacheWarmer": {
//           "logLevel": "DEBUG",
//           "components": {
//             "Strategy": {
//               "logLevel": "TRACE",
//               "components": {
//                 "LRU": { "logLevel": "DEBUG" },
//                 "FIFO": { "logLevel": "TRACE" },
//                 "ARC": {
//                   "logLevel": "TRACE",
//                   "components": {
//                     "T1": { "logLevel": "DEBUG" },
//                     "T2": { "logLevel": "TRACE" }
//                   }
//                 }
//               }
//             },
//             "DataLoader": { "logLevel": "INFO" }
//           }
//         },
//         "TwoLayerCache": {
//           "logLevel": "WARNING",
//           "components": {
//             "L1Cache": {
//               "logLevel": "ERROR",
//               "components": {
//                 "MemoryStore": {
//                   "logLevel": "WARNING",
//                   "components": {
//                     "Allocator": { "logLevel": "DEBUG" }
//                   }
//                 },
//                 "IndexedDB": {
//                   "logLevel": "ERROR",
//                   "components": {
//                     "Transaction": { "logLevel": "WARNING" }
//                   }
//                 }
//               }
//             },
//             "L2Cache": {
//               "logLevel": "INFO",
//               "components": {
//                 "DiskStore": { "logLevel": "DEBUG" }
//               }
//             }
//           }
//         },
//         "Analytics": {
//           "logLevel": "INFO",
//           "components": {
//             "HitRateTracker": { "logLevel": "DEBUG" },
//             "PerformanceMonitor": { "logLevel": "TRACE" }
//           }
//         }
//       }
//     }
//   }
// }'

// ============================================================================
// EXAMPLE 1: Deep Nesting (5 levels)
// ============================================================================
console.log('\n=== Example 1: Deep Nesting (5 levels) ===\n');

const baseLogger = getLogger('@fjell/cache');
const warmerLogger = baseLogger.get('CacheWarmer');
const strategyLogger = warmerLogger.get('Strategy');
const arcLogger = strategyLogger.get('ARC');
const t1Logger = arcLogger.get('T1');

// Each level has progressively different verbosity
baseLogger.info('Base cache initialized');
// baseLogger.debug('Would not log'); // INFO level

warmerLogger.debug('Cache warmer starting');
// warmerLogger.trace('Would not log'); // DEBUG level

strategyLogger.trace('Evaluating eviction strategies');

arcLogger.trace('ARC algorithm activated');
// arcLogger.debug('Also would log'); // TRACE allows DEBUG

t1Logger.debug('T1 partition size adjusted');
// t1Logger.trace('Would not log'); // DEBUG level

// ============================================================================
// EXAMPLE 2: Multiple Sibling Branches
// ============================================================================
console.log('\n=== Example 2: Multiple Sibling Branches ===\n');

// Different branches operate independently
const lruLogger = strategyLogger.get('LRU');
const fifoLogger = strategyLogger.get('FIFO');

lruLogger.debug('LRU eviction triggered'); // Will log (DEBUG)
// lruLogger.trace('Would not log'); // DEBUG level

fifoLogger.trace('FIFO queue processing'); // Will log (TRACE)
fifoLogger.debug('FIFO queue size adjusted'); // Also logs (TRACE allows DEBUG)

// ============================================================================
// EXAMPLE 3: Deep Multi-Level Storage Hierarchy (4 levels)
// ============================================================================
console.log('\n=== Example 3: Deep Storage Hierarchy ===\n');

const twoLayerLogger = baseLogger.get('TwoLayerCache');
const l1Logger = twoLayerLogger.get('L1Cache');
const memStoreLogger = l1Logger.get('MemoryStore');
const allocatorLogger = memStoreLogger.get('Allocator');

// twoLayerLogger.info('Would not log'); // WARNING level
twoLayerLogger.warning('L2 cache miss rate high');

// l1Logger.warning('Would not log'); // ERROR level
l1Logger.error('L1 cache corruption detected');

memStoreLogger.warning('Memory store fragmentation detected'); // Will log

allocatorLogger.debug('Memory allocation optimized'); // Will log (DEBUG)

// ============================================================================
// EXAMPLE 4: Parallel Deep Hierarchies
// ============================================================================
console.log('\n=== Example 4: Parallel Hierarchies ===\n');

const indexedDBLogger = l1Logger.get('IndexedDB');
const transactionLogger = indexedDBLogger.get('Transaction');

const l2Logger = twoLayerLogger.get('L2Cache');
const diskStoreLogger = l2Logger.get('DiskStore');

// IndexedDB branch (ERROR → WARNING)
indexedDBLogger.error('IndexedDB quota exceeded');
// indexedDBLogger.warning('Would not log'); // ERROR level

transactionLogger.warning('Transaction rollback initiated');

// DiskStore branch (INFO → DEBUG)
l2Logger.info('L2 cache hit ratio: 85%');
diskStoreLogger.debug('Disk cache compaction started');

// ============================================================================
// EXAMPLE 5: Unconfigured Components Inherit Parent Level
// ============================================================================
console.log('\n=== Example 5: Component Inheritance ===\n');

// Create a logger for an unconfigured component
const unconfiguredLogger = warmerLogger.get('NewFeature');

// It inherits from CacheWarmer (DEBUG level)
unconfiguredLogger.debug('New feature initialized');
// unconfiguredLogger.trace('Would not log'); // DEBUG level

// Create another level deeper
const deepUnconfiguredLogger = unconfiguredLogger.get('SubFeature');

// Still inherits DEBUG from CacheWarmer
deepUnconfiguredLogger.debug('Sub-feature processing');

// ============================================================================
// EXAMPLE 6: Real-World Debugging Scenario
// ============================================================================
console.log('\n=== Example 6: Real-World Debugging Scenario ===\n');

// Scenario: You need to debug cache warming strategy issues
// but don't want to be flooded with other cache logs

const analyticsLogger = baseLogger.get('Analytics');
const hitRateLogger = analyticsLogger.get('HitRateTracker');
const perfMonLogger = analyticsLogger.get('PerformanceMonitor');

// Base cache logs only important events (INFO)
baseLogger.info('Cache system operational');

// Cache warming strategy logs everything (TRACE)
strategyLogger.trace('Evaluating cache entry priority');
strategyLogger.debug('Strategy decision: keep in cache');

// Analytics logs selectively
hitRateLogger.debug('Hit rate: 92.5%');
perfMonLogger.trace('Cache lookup time: 0.3ms');

// Other components stay quiet unless important
twoLayerLogger.error('Critical: L2 cache unavailable');

// ============================================================================
// EXAMPLE 7: Dynamic Component Creation
// ============================================================================
console.log('\n=== Example 7: Dynamic Component Creation ===\n');

// You can create loggers on-demand for any component hierarchy
function processWithLogging(cacheName: string, operation: string) {
  const operationLogger = baseLogger
    .get('CacheWarmer')
    .get('Strategy')
    .get(operation);
  
  operationLogger.debug(`Processing ${cacheName}`);
  // ... processing logic ...
  operationLogger.trace(`Completed ${cacheName}`);
}

processWithLogging('user-sessions', 'LRU');
processWithLogging('api-responses', 'FIFO');

// ============================================================================
// Summary
// ============================================================================
console.log('\n=== Configuration Summary ===\n');

console.log('Hierarchy depths tested:');
console.log('  • 1 level:  @fjell/cache → CacheWarmer');
console.log('  • 2 levels: @fjell/cache → CacheWarmer → Strategy');
console.log('  • 3 levels: @fjell/cache → CacheWarmer → Strategy → LRU');
console.log('  • 4 levels: @fjell/cache → CacheWarmer → Strategy → ARC → T1');
console.log('  • 5 levels: @fjell/cache → TwoLayerCache → L1Cache → MemoryStore → Allocator');

console.log('\nBranch independence:');
console.log('  • CacheWarmer branch: DEBUG-TRACE levels');
console.log('  • TwoLayerCache branch: WARNING-ERROR levels');
console.log('  • Analytics branch: INFO-TRACE levels');

console.log('\nKey features demonstrated:');
console.log('  ✓ Multiple levels of nesting (up to 5 levels)');
console.log('  ✓ Independent sibling branches');
console.log('  ✓ Different log levels at each depth');
console.log('  ✓ Inheritance for unconfigured components');
console.log('  ✓ Real-world debugging scenarios');
console.log('  ✓ Dynamic component creation');

console.log('\n🎉 All hierarchical logging features demonstrated!\n');
