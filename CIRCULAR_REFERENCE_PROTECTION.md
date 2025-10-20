# Circular Reference Protection

## Problem

When logging objects with circular references using `JSON.stringify`, Node.js throws a `TypeError: Converting circular structure to JSON` which can crash your application. This was a major pain point that could paralyze development and production systems.

## Solution

The `@fjell/logging` package now includes **comprehensive circular reference protection** that ensures your application will **NEVER crash** due to non-serializable objects being logged.

## How It Works

### 1. Safe Serialization
All objects are serialized using a custom implementation that:
- Detects circular references before they cause crashes
- Marks circular references with `"(circular)"` in the output
- Handles edge cases like BigInt, Symbols, getters that throw, etc.
- Provides comprehensive error handling at multiple levels

### 2. Multiple Layers of Protection

```
┌─────────────────────────────────────────┐
│ Layer 1: Custom Serializer             │
│ - Tracks visited objects                │
│ - Marks circular refs as "(circular)"  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Layer 2: Error Catching                 │
│ - Catches any serialization errors      │
│ - Returns safe fallback strings         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Layer 3: Structured Log Safety          │
│ - safeJSONStringify for STRUCTURED logs │
│ - Handles entire log entry failures     │
└─────────────────────────────────────────┘
```

### 3. Comprehensive Coverage

Protection applies to:
- ✅ **TEXT format** logging
- ✅ **STRUCTURED format** logging (critical for production)
- ✅ All log levels (TRACE, DEBUG, INFO, WARNING, ERROR, etc.)
- ✅ Format specifiers (`%j`, `%o`, `%O`)
- ✅ Direct object logging
- ✅ Nested objects and arrays

## Examples

### Basic Circular Reference

```typescript
import { getLogger } from '@fjell/logging';

const logger = getLogger('myapp');

const obj: any = { name: 'John', age: 30 };
obj.self = obj;  // Create circular reference

// This will NOT crash - it logs safely
logger.info('User object:', obj);
// Output: {"name":"John","age":30,"self":"(circular)"}
```

### Real-World Express Example

```typescript
import express from 'express';
import { getLogger } from '@fjell/logging';

const app = express();
const logger = getLogger('api');

app.post('/users', (req, res) => {
  // Express adds circular references: req.res -> res, res.req -> req
  
  // This is SAFE - no crash even with circular references
  logger.debug('Processing request', req);
  
  // Process the request...
  const user = createUser(req.body);
  
  // This is also SAFE
  logger.info('Created user', { user, request: req });
  
  res.json(user);
});
```

### Nested Circular References

```typescript
const logger = getLogger('myapp');

const parent: any = { name: 'Parent' };
const child: any = { name: 'Child', parent: parent };
parent.child = child;  // Circular reference

// Logs safely with circular marker
logger.info('Family tree:', parent);
// Output: {"name":"Parent","child":{"name":"Child","parent":"(circular)"}}
```

### Complex Object with Multiple Issues

```typescript
const logger = getLogger('myapp');

const problematic = {
  name: 'Test',
  bigNumber: BigInt(123456789),  // Not JSON serializable
  date: new Date(),
  regex: /test/gi,
  symbol: Symbol('test'),
  func: () => 'hello',
  get dangerous() {
    throw new Error('Getter throws!');
  }
};

// All of these are handled gracefully - NO CRASH
logger.info('Problematic object:', problematic);
```

## What Gets Logged?

| Type | Logged As | Example |
|------|-----------|---------|
| Circular Reference | `"(circular)"` | `{"self":"(circular)"}` |
| Date | `{}` | `{}` |
| RegExp | `{}` | `{}` |
| Error | `{}` | `{}` |
| Symbol | `""` (empty string) | Omitted |
| Function | Omitted | `{"name":"John"}` (no func prop) |
| BigInt | Falls back safely | Logged via fallback |
| undefined | Omitted | `{"name":"John"}` (no undef prop) |

## Error Handling Guarantees

1. **Never Throws**: The serialization functions are guaranteed to never throw errors
2. **Safe Fallbacks**: If serialization fails, safe placeholder strings are returned
3. **Continues Logging**: After encountering a circular reference, logging continues normally
4. **Production Ready**: Designed for high-volume production logging with STRUCTURED format

## Performance

- Minimal overhead for objects without circular references
- Only tracks visited objects when needed
- Memory-efficient using WeakSet for circular detection in structured logs
- No performance impact on normal logging operations

## Migration

No changes needed! The protection is automatic and backwards compatible:

```typescript
// Your existing code works exactly the same
const logger = getLogger('myapp');
logger.info('Message', someObject);  // Now safer!
```

## Testing

Run the comprehensive safety tests:

```bash
npm test tests/circular-safety.test.ts
```

These tests verify that circular references, BigInt, Symbols, throwing getters, and other edge cases are all handled without crashing.

## Previous Behavior

**Before**: Logging an object with circular references would crash with:
```
TypeError: Converting circular structure to JSON
    at JSON.stringify (<anonymous>)
    ...
    [Application crashes]
```

**Now**: Circular references are safely marked and logged:
```json
{"name":"John","self":"(circular)"}
```

## Why This Matters

In production environments, you often log:
- Request/Response objects (Express, Fastify, etc.) - often circular
- Database query results with relationships - can be circular
- Complex domain objects - may have circular references
- Third-party library objects - unknown structure

With this protection, you can **log freely without fear of crashes**. The library will handle any non-serializable content gracefully.

## Additional Resources

- See `tests/circular-safety.test.ts` for comprehensive examples
- See `tests/utils.test.ts` for detailed serialization tests
- See `MASKING.md` for information about sensitive data protection

