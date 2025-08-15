/**
 * Cross-platform utility functions that work in both Node.js and browser environments
 */

/**
 * Recursive implementation of JSON.stringify that handles circular references safely
 */
export const stringifyJSON = function (obj: any, visited: Set<any> = new Set()): string {
  const arrOfKeyVals: string[] = [];
  const arrVals: string[] = [];
  let objKeys: string[] = [];

  // Check for primitive types
  if (typeof obj === 'number' || typeof obj === 'boolean' || obj === null)
    return '' + obj;
  else if (typeof obj === 'string')
    return '"' + obj + '"';

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
      obj.forEach(function (el) {
        arrVals.push(stringifyJSON(el, visited));
      });
      // Remove array from visited after processing to prevent memory leaks
      visited.delete(obj);
      return '[' + arrVals + ']';
    }
  }
  // Check for object
  else if (obj instanceof Object) {
    // Add object to visited before processing its properties
    visited.add(obj);
    // Get object keys
    objKeys = Object.keys(obj);
    // Set key output
    objKeys.forEach(function (key) {
      const keyOut = '"' + key + '":';
      const keyValOut = obj[key];
      // Skip functions and undefined properties
      if (keyValOut instanceof Function || typeof keyValOut === 'undefined')
        return; // Skip this entry entirely instead of pushing an empty string
      else if (typeof keyValOut === 'string')
        arrOfKeyVals.push(keyOut + '"' + keyValOut + '"');
      else if (typeof keyValOut === 'boolean' || typeof keyValOut === 'number' || keyValOut === null)
        arrOfKeyVals.push(keyOut + keyValOut);
      // Check for nested objects, call recursively until no more objects
      else if (keyValOut instanceof Object) {
        arrOfKeyVals.push(keyOut + stringifyJSON(keyValOut, visited));
      }
    });
    // Remove object from visited after processing to prevent memory leaks
    visited.delete(obj);
    return '{' + arrOfKeyVals + '}';
  }
  return '';
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
    return stringifyJSON(obj);
  } catch {
    // If stringifyJSON fails, fall back to a safe representation
    return `[Object: ${typeof obj}]`;
  }
};
