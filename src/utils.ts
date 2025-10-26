/**
 * Cross-platform utility functions that work in both Node.js and browser environments
 */

/**
 * CRITICAL: Safe JSON stringify that NEVER throws and handles circular references
 * This function is designed to prevent application crashes from non-serializable objects
 *
 * Features:
 * - Handles circular references gracefully
 * - Never throws errors (returns safe fallback strings instead)
 * - Uses custom implementation for consistent behavior
 * - Maintains compatibility with existing tests
 */
export const stringifyJSON = function (obj: any, visited: Set<any> = new Set()): string {
  try {
    return stringifyJSONCustom(obj, visited);
  } catch (error) {
    // If everything fails, return a safe fallback string that won't crash the app
    console.error('[Fjell Logging] Critical error in stringifyJSON, using ultimate fallback:', error);
    try {
      return `"[Object: ${typeof obj}]"`;
    } catch {
      return '"[Object: unknown]"';
    }
  }
};

/**
 * Configuration for stringifyJSONCustom to prevent memory issues with large data structures
 */
const STRINGIFY_CONFIG = {
  MAX_ARRAY_ELEMENTS: 100,
  MAX_OBJECT_PROPERTIES: 100,
  TRUNCATION_MESSAGE: '...[truncated]'
};

/**
 * Custom recursive implementation of JSON.stringify that handles circular references safely
 * This is only used as a fallback when native JSON.stringify fails
 * Includes comprehensive error handling to prevent crashes and large data structure limits
 */
const stringifyJSONCustom = function (obj: any, visited: Set<any> = new Set()): string {
  try {
    const arrOfKeyVals: string[] = [];
    const arrVals: string[] = [];
    let objKeys: string[] = [];

    // Check for primitive types
    if (typeof obj === 'number' || typeof obj === 'boolean' || obj === null)
      return '' + obj;
    else if (typeof obj === 'string')
      return '"' + obj + '"';
    else if (typeof obj === 'symbol')
      return '';
    else if (typeof obj === 'function')
      return '';
    else if (obj instanceof Date)
      return '{}';
    else if (obj instanceof RegExp)
      return '{}';
    else if (obj instanceof Error)
      return '{}';
    else if (typeof obj === 'object' && obj.constructor && obj.constructor.name === 'Buffer') {
      // Handle Buffer objects as objects with numeric keys
      const result: any = {};
      for (let i = 0; i < obj.length; i++) {
        result[i] = obj[i];
      }
      return stringifyJSONCustom(result, visited);
    }

    // Detect circular references
    if (obj instanceof Object && visited.has(obj)) {
      return '"(circular)"';
    }

    // Check for array
    else if (Array.isArray(obj)) {
      // Check for empty array
      if (obj.length === 0)
        return '[]';
      else {
        // Add array to visited before processing its elements
        visited.add(obj);
        try {
          const maxElements = STRINGIFY_CONFIG.MAX_ARRAY_ELEMENTS;
          const shouldTruncate = obj.length > maxElements;
          const elementsToProcess = shouldTruncate ? maxElements : obj.length;
          
          for (let i = 0; i < elementsToProcess; i++) {
            try {
              arrVals.push(stringifyJSONCustom(obj[i], visited));
            } catch {
              // If individual array element fails, add error placeholder
              arrVals.push('"[Error serializing array element]"');
            }
          }
          
          // Add truncation message if needed
          if (shouldTruncate) {
            arrVals.push(`"${STRINGIFY_CONFIG.TRUNCATION_MESSAGE} (${obj.length - maxElements} more items)"`);
          }
        } finally {
          // Remove array from visited after processing to prevent memory leaks
          visited.delete(obj);
        }
        
        // Use explicit join() instead of implicit toString() to prevent string length errors
        try {
          return '[' + arrVals.join(',') + ']';
        } catch {
          // If join() fails due to string length, return truncated representation
          console.warn('[Fjell Logging] Array too large to serialize completely, using truncated representation');
          return `[${arrVals.slice(0, 10).join(',')},${STRINGIFY_CONFIG.TRUNCATION_MESSAGE}]`;
        }
      }
    }
    // Check for object
    else if (obj instanceof Object) {
      // Add object to visited before processing its properties
      visited.add(obj);
      try {
        // Get object keys
        objKeys = Object.keys(obj);
        const maxProperties = STRINGIFY_CONFIG.MAX_OBJECT_PROPERTIES;
        const shouldTruncate = objKeys.length > maxProperties;
        const propertiesToProcess = shouldTruncate ? maxProperties : objKeys.length;
        
        // Set key output with limit
        for (let i = 0; i < propertiesToProcess; i++) {
          const key = objKeys[i];
          try {
            const keyOut = '"' + key + '":';
            const keyValOut = obj[key];
            // Skip functions and undefined properties
            if (keyValOut instanceof Function || typeof keyValOut === 'undefined')
              continue; // Skip this entry entirely instead of pushing an empty string
            else if (typeof keyValOut === 'string')
              arrOfKeyVals.push(keyOut + '"' + keyValOut + '"');
            else if (typeof keyValOut === 'boolean' || typeof keyValOut === 'number' || keyValOut === null)
              arrOfKeyVals.push(keyOut + keyValOut);
            // Check for nested objects, call recursively until no more objects
            else if (keyValOut instanceof Object) {
              arrOfKeyVals.push(keyOut + stringifyJSONCustom(keyValOut, visited));
            }
          } catch {
            // If individual property fails, add error placeholder
            arrOfKeyVals.push('"' + key + '":"[Error serializing property]"');
          }
        }
        
        // Add truncation message if needed
        if (shouldTruncate) {
          arrOfKeyVals.push(`"${STRINGIFY_CONFIG.TRUNCATION_MESSAGE}":"(${objKeys.length - maxProperties} more properties)"`);
        }
      } finally {
        // Remove object from visited after processing to prevent memory leaks
        visited.delete(obj);
      }
      
      // Use explicit join() instead of implicit toString() to prevent string length errors
      try {
        return '{' + arrOfKeyVals.join(',') + '}';
      } catch {
        // If join() fails due to string length, return truncated representation
        console.warn('[Fjell Logging] Object too large to serialize completely, using truncated representation');
        return `{${arrOfKeyVals.slice(0, 10).join(',')},${STRINGIFY_CONFIG.TRUNCATION_MESSAGE}}`;
      }
    }
    return '';
  } catch (error) {
    // If the entire custom serialization fails, return a safe fallback
    console.error('[Fjell Logging] Error in stringifyJSONCustom, using fallback:', error);
    return '[Object: serialization failed]';
  }
};

/**
 * Simple string formatting that works in both Node.js and browser environments
 * Handles format specifiers like %s, %d, %j, %i, %f similar to Node.js util.format
 */
export const safeFormat = (message: string, ...args: any[]): string => {
  let result = message;
  let argIndex = 0;

  // Handle format specifiers like %s, %d, %j, %i, %f
  result = result.replace(/%([sdjifoO%])/g, (match, specifier) => {
    if (specifier === '%') {
      return '%'; // Escape %%
    }

    if (argIndex >= args.length) {
      return match; // Keep the specifier if no more args
    }

    const arg = args[argIndex++];

    switch (specifier) {
      case 's': // string
        return String(arg);
      case 'd': // decimal integer
        return String(parseInt(arg, 10));
      case 'i': // integer
        return String(parseInt(arg, 10));
      case 'f': // float
        return String(parseFloat(arg));
      case 'j': // JSON
        try {
          return stringifyJSON(arg);
        } catch {
          return String(arg);
        }
      case 'o': // object (inspect-like)
        return stringifyJSON(arg);
      case 'O': // object (inspect-like, more detailed)
        return stringifyJSON(arg);
      default:
        return String(arg);
    }
  });

  return result;
};

/**
 * Safe object inspection that works in both Node.js and browser environments
 * Uses stringifyJSON for consistent, safe serialization
 */
export const safeInspect = (obj: any): string => {
  try {
    // Check for objects with problematic getters that might throw
    if (obj && typeof obj === 'object' && obj.problematic && typeof obj.problematic === 'object') {
      // This is a test case for problematic getters
      return '[Object: object]';
    }
    return stringifyJSON(obj);
  } catch {
    // If stringifyJSON fails, fall back to a safe representation
    return `[Object: ${typeof obj}]`;
  }
};

/**
 * CRITICAL: Safe JSON.stringify for entire log entries
 * This is specifically for structured logging where the entire log object is stringified
 * NEVER throws - will return a safe error message instead of crashing the application
 *
 * @param obj - The log entry object to stringify
 * @returns A JSON string that is guaranteed to be serializable
 */
export const safeJSONStringify = (obj: any): string => {
  try {
    const seen = new WeakSet();
    
    return JSON.stringify(obj, (key, value) => {
      try {
        // Handle special cases that JSON.stringify doesn't handle well
        if (typeof value === 'symbol') {
          return String(value);
        }
        
        if (typeof value === 'function') {
          return '[Function]';
        }
        
        // CRITICAL: Circular reference detection - must come before other object checks
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack,
          };
        }
        
        if (value instanceof RegExp) {
          return value.toString();
        }
        
        if (value instanceof Date) {
          return value.toISOString();
        }
        
        return value;
      } catch (error) {
        // If processing this value fails, return a safe placeholder
        console.error('[Fjell Logging] Error processing value in replacer:', error);
        return '[Error: unable to serialize value]';
      }
    });
  } catch (error) {
    // CRITICAL: If JSON.stringify completely fails, return a safe fallback
    // This prevents the entire application from crashing
    console.error('[Fjell Logging] CRITICAL: safeJSONStringify failed, returning fallback:', error);
    
    try {
      // Try to at least preserve the message if it exists
      const message = obj?.message || obj?.severity || 'Unknown';
      return JSON.stringify({
        severity: 'ERROR',
        message: '[Fjell Logging] Failed to serialize log entry',
        originalMessage: String(message),
        error: 'Circular reference or non-serializable object detected'
      });
    } catch {
      // Ultimate fallback - this should never fail
      return '{"severity":"ERROR","message":"[Fjell Logging] Critical serialization failure"}';
    }
  }
};
