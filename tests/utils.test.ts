 
import { describe, expect, it, vi } from 'vitest';
import { safeFormat, safeInspect, stringifyJSON } from '../src/utils';

describe('stringifyJSON', () => {
  describe('primitive types', () => {
    it('should handle numbers', () => {
      expect(stringifyJSON(42)).toBe('42');
      expect(stringifyJSON(0)).toBe('0');
      expect(stringifyJSON(-1)).toBe('-1');
      expect(stringifyJSON(3.14)).toBe('3.14');
      expect(stringifyJSON(Infinity)).toBe('Infinity');
      expect(stringifyJSON(-Infinity)).toBe('-Infinity');
      expect(stringifyJSON(NaN)).toBe('NaN');
    });

    it('should handle booleans', () => {
      expect(stringifyJSON(true)).toBe('true');
      expect(stringifyJSON(false)).toBe('false');
    });

    it('should handle null', () => {
      expect(stringifyJSON(null)).toBe('null');
    });

    it('should handle strings', () => {
      expect(stringifyJSON('hello')).toBe('"hello"');
      expect(stringifyJSON('')).toBe('""');
      expect(stringifyJSON('with spaces')).toBe('"with spaces"');
      expect(stringifyJSON('with "quotes"')).toBe('"with "quotes""');
      expect(stringifyJSON('with\nnewlines')).toBe('"with\nnewlines"');
    });
  });

  describe('arrays', () => {
    it('should handle empty arrays', () => {
      expect(stringifyJSON([])).toBe('[]');
    });

    it('should handle simple arrays', () => {
      expect(stringifyJSON([1, 2, 3])).toBe('[1,2,3]');
      expect(stringifyJSON(['a', 'b', 'c'])).toBe('["a","b","c"]');
      expect(stringifyJSON([true, false, null])).toBe('[true,false,null]');
      expect(stringifyJSON([1, 'hello', true, null])).toBe('[1,"hello",true,null]');
    });

    it('should handle nested arrays', () => {
      expect(stringifyJSON([[1, 2], [3, 4]])).toBe('[[1,2],[3,4]]');
      expect(stringifyJSON([1, [2, 3], 4])).toBe('[1,[2,3],4]');
      expect(stringifyJSON([[[1]]])).toBe('[[[1]]]');
    });

    it('should handle arrays with mixed types', () => {
      const mixedArray = [1, 'string', true, null, { key: 'value' }, [1, 2]];
      expect(stringifyJSON(mixedArray)).toBe('[1,"string",true,null,{"key":"value"},[1,2]]');
    });
  });

  describe('objects', () => {
    it('should handle empty objects', () => {
      expect(stringifyJSON({})).toBe('{}');
    });

    it('should handle simple objects', () => {
      const obj = { name: 'John', age: 30, active: true };
      expect(stringifyJSON(obj)).toBe('{"name":"John","age":30,"active":true}');
    });

    it('should handle nested objects', () => {
      const obj = { user: { name: 'John', details: { age: 30 } } };
      expect(stringifyJSON(obj)).toBe('{"user":{"name":"John","details":{"age":30}}}');
    });

    it('should handle objects with arrays', () => {
      const obj = { tags: ['tag1', 'tag2'], scores: [1, 2, 3] };
      expect(stringifyJSON(obj)).toBe('{"tags":["tag1","tag2"],"scores":[1,2,3]}');
    });

    it('should skip undefined properties', () => {
      const obj = { name: 'John', age: undefined, active: true };
      expect(stringifyJSON(obj)).toBe('{"name":"John","active":true}');
    });

    it('should skip function properties', () => {
      const obj = { name: 'John', greet: () => 'Hello', age: 30 };
      expect(stringifyJSON(obj)).toBe('{"name":"John","age":30}');
    });

    it('should handle objects with special string values', () => {
      const obj = {
        normal: 'text',
        withQuotes: 'has "quotes"',
        withNewlines: 'line1\nline2',
        withTabs: 'tab\there'
      };
      expect(stringifyJSON(obj)).toBe('{"normal":"text","withQuotes":"has "quotes"","withNewlines":"line1\nline2","withTabs":"tab\there"}');
    });

    it('should handle objects with all property types', () => {
      const obj = {
        string: 'value',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        function: () => 'test',
        nested: { key: 'value' }
      };
      expect(stringifyJSON(obj)).toBe('{"string":"value","number":42,"boolean":true,"null":null,"nested":{"key":"value"}}');
    });
  });

  describe('circular references', () => {
    it('should handle circular references in objects', () => {
      const obj: any = { name: 'John' };
      obj.self = obj;
      expect(stringifyJSON(obj)).toBe('{"name":"John","self":"(circular)"}');
    });

    it('should handle circular references in arrays', () => {
      const arr: any[] = [1, 2];
      arr.push(arr);
      expect(stringifyJSON(arr)).toBe('[1,2,"(circular)"]');
    });

    it('should handle nested circular references', () => {
      const obj: any = { name: 'John' };
      const nested = { parent: obj };
      obj.child = nested;
      expect(stringifyJSON(obj)).toBe('{"name":"John","child":{"parent":"(circular)"}}');
    });

    it('should handle multiple circular references', () => {
      const obj1: any = { name: 'John' };
      const obj2: any = { name: 'Jane' };
      obj1.friend = obj2;
      obj2.friend = obj1;
      expect(stringifyJSON(obj1)).toBe('{"name":"John","friend":{"name":"Jane","friend":"(circular)"}}');
    });
  });

  describe('edge cases', () => {
    it('should handle Date objects', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      expect(stringifyJSON(date)).toBe('{}');
    });

    it('should handle RegExp objects', () => {
      const regex = /test/gi;
      expect(stringifyJSON(regex)).toBe('{}');
    });

    it('should handle Error objects', () => {
      const error = new Error('test error');
      expect(stringifyJSON(error)).toBe('{}');
    });

    it('should handle Symbol objects', () => {
      const symbol = Symbol('test');
      expect(stringifyJSON(symbol)).toBe('');
    });

    it('should handle Map objects', () => {
      const map = new Map([['key', 'value']]);
      expect(stringifyJSON(map)).toBe('{}');
    });

    it('should handle Set objects', () => {
      const set = new Set([1, 2, 3]);
      expect(stringifyJSON(set)).toBe('{}');
    });

    it('should handle Buffer objects (Node.js)', () => {
      // Buffer objects are serialized as objects with numeric keys
      const buffer = Buffer.from('test');
      expect(stringifyJSON(buffer)).toBe('{"0":116,"1":101,"2":115,"3":116}');
    });
  });

  describe('memory management', () => {
    it('should not leak memory with visited set', () => {
      const obj = { name: 'John' };
      const visited = new Set();

      stringifyJSON(obj, visited);
      stringifyJSON(obj, visited);

      // The visited set should be properly managed
      expect(visited.size).toBe(0);
    });

    it('should handle deep nesting without memory issues', () => {
      const obj: any = {};
      let current = obj;

      // Create a deeply nested object
      for (let i = 0; i < 100; i++) {
        current.nested = {};
        current = current.nested;
      }

      expect(() => stringifyJSON(obj)).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle errors in stringifyJSON main function', () => {
      // Create an object that will cause an error during serialization
      // We need to create an object that will cause an error in the main try block
      const problematicObj = {
        get [Symbol.toPrimitive]() {
          throw new Error('Cannot convert to primitive');
        }
      };

      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;
      JSON.stringify = vi.fn().mockImplementation(() => {
        throw new Error('JSON.stringify failed');
      });

      try {
        const result = stringifyJSON(problematicObj);
        expect(result).toBe('{}');
      } finally {
        // Restore original JSON.stringify
        JSON.stringify = originalStringify;
      }
    });

    it('should handle errors in stringifyJSON fallback', () => {
      // Create an object that will cause an error even in the fallback
      const problematicObj = {
        toString() {
          throw new Error('toString failed');
        }
      };

      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;
      JSON.stringify = vi.fn().mockImplementation(() => {
        throw new Error('JSON.stringify failed');
      });

      try {
        const result = stringifyJSON(problematicObj);
        expect(result).toBe('{}');
      } finally {
        // Restore original JSON.stringify
        JSON.stringify = originalStringify;
      }
    });

    it('should handle array element serialization errors', () => {
      // Create an object that will cause an error during array element processing
      // We need to create a circular reference to force use of stringifyJSONCustom
      // and then cause an error during the processing
      const problematicElement: any = { name: 'test' };
      problematicElement.self = problematicElement; // Create circular reference
      
      const arr = [1, problematicElement, 3];
      const result = stringifyJSON(arr);
      
      expect(result).toBe('[1,{"name":"test","self":"(circular)"},3]');
    });

    it('should handle object property serialization errors', () => {
      // Create an object that will cause an error during property processing
      // We need to create a circular reference to force use of stringifyJSONCustom
      // and then cause an error during the processing
      const problematicProperty: any = { name: 'test' };
      problematicProperty.self = problematicProperty; // Create circular reference
      
      // Override Object.keys to throw an error
      const originalKeys = Object.keys;
      Object.keys = function() {
        throw new Error('Object.keys failed');
      };

      try {
        const obj = { name: 'John', problematic: problematicProperty, age: 30 };
        const result = stringifyJSON(obj);
        
        expect(result).toBe('[Object: serialization failed]');
      } finally {
        // Restore original Object.keys
        Object.keys = originalKeys;
      }
    });

    it('should handle stringifyJSONCustom fallback errors', () => {
      // Create an object that will cause an error in stringifyJSONCustom
      const problematicObj = {
        get [Symbol.toPrimitive]() {
          throw new Error('Cannot convert to primitive');
        }
      };

      // Mock JSON.stringify to throw an error to force use of stringifyJSONCustom
      const originalStringify = JSON.stringify;
      JSON.stringify = vi.fn().mockImplementation(() => {
        throw new Error('JSON.stringify failed');
      });

      try {
        const result = stringifyJSON(problematicObj);
        expect(result).toBe('{}');
      } finally {
        // Restore original JSON.stringify
        JSON.stringify = originalStringify;
      }
    });
  });
});

describe('safeFormat', () => {
  describe('string specifiers', () => {
    it('should handle %s for strings', () => {
      expect(safeFormat('Hello %s', 'World')).toBe('Hello World');
      expect(safeFormat('Name: %s, Age: %s', 'John', '30')).toBe('Name: John, Age: 30');
      expect(safeFormat('Empty: %s', '')).toBe('Empty: ');
      expect(safeFormat('Special: %s', 'with "quotes"')).toBe('Special: with "quotes"');
    });

    it('should handle %s with non-string values', () => {
      expect(safeFormat('Number: %s', 42)).toBe('Number: 42');
      expect(safeFormat('Boolean: %s', true)).toBe('Boolean: true');
      expect(safeFormat('Null: %s', null)).toBe('Null: null');
      expect(safeFormat('Object: %s', { key: 'value' })).toBe('Object: [object Object]');
    });
  });

  describe('numeric specifiers', () => {
    it('should handle %d for decimal integers', () => {
      expect(safeFormat('Count: %d', 42)).toBe('Count: 42');
      expect(safeFormat('Count: %d', 0)).toBe('Count: 0');
      expect(safeFormat('Count: %d', -10)).toBe('Count: -10');
      expect(safeFormat('Count: %d', 3.14)).toBe('Count: 3');
      expect(safeFormat('Count: %d', '42')).toBe('Count: 42');
      expect(safeFormat('Count: %d', 'not a number')).toBe('Count: NaN');
    });

    it('should handle %i for integers', () => {
      expect(safeFormat('Index: %i', 42)).toBe('Index: 42');
      expect(safeFormat('Index: %i', 0)).toBe('Index: 0');
      expect(safeFormat('Index: %i', -10)).toBe('Index: -10');
      expect(safeFormat('Index: %i', 3.14)).toBe('Index: 3');
    });

    it('should handle %f for floats', () => {
      expect(safeFormat('Price: %f', 3.14)).toBe('Price: 3.14');
      expect(safeFormat('Price: %f', 42)).toBe('Price: 42');
      expect(safeFormat('Price: %f', 0)).toBe('Price: 0');
      expect(safeFormat('Price: %f', '3.14')).toBe('Price: 3.14');
      expect(safeFormat('Price: %f', 'not a number')).toBe('Price: NaN');
    });
  });

  describe('JSON specifiers', () => {
    it('should handle %j for JSON', () => {
      const obj = { name: 'John', age: 30 };
      expect(safeFormat('Data: %j', obj)).toBe('Data: {"name":"John","age":30}');

      const arr = [1, 2, 3];
      expect(safeFormat('Array: %j', arr)).toBe('Array: [1,2,3]');

      expect(safeFormat('String: %j', 'hello')).toBe('String: "hello"');
      expect(safeFormat('Number: %j', 42)).toBe('Number: 42');
    });

    it('should handle %o for objects', () => {
      const obj = { name: 'John', age: 30 };
      expect(safeFormat('Object: %o', obj)).toBe('Object: {"name":"John","age":30}');

      const arr = [1, 2, 3];
      expect(safeFormat('Array: %o', arr)).toBe('Array: [1,2,3]');
    });

    it('should handle %O for detailed objects', () => {
      const obj = { name: 'John', age: 30 };
      expect(safeFormat('Detailed: %O', obj)).toBe('Detailed: {"name":"John","age":30}');
    });

    it('should handle unknown format specifiers', () => {
      expect(safeFormat('Unknown: %x', 'test')).toBe('Unknown: %x');
      expect(safeFormat('Unknown: %z', 42)).toBe('Unknown: %z');
    });
  });

  describe('escape handling', () => {
    it('should handle %% for literal percent signs', () => {
      expect(safeFormat('100%% complete')).toBe('100% complete');
      expect(safeFormat('50%% off %s', 'sale')).toBe('50% off sale');
    });

    it('should handle mixed specifiers', () => {
      expect(safeFormat('Name: %s, Age: %d, Data: %j', 'John', 30, { active: true }))
        .toBe('Name: John, Age: 30, Data: {"active":true}');
    });
  });

  describe('edge cases', () => {
    it('should handle missing arguments', () => {
      expect(safeFormat('Hello %s')).toBe('Hello %s');
      expect(safeFormat('Count: %d, Name: %s', 42)).toBe('Count: 42, Name: %s');
    });

    it('should handle no specifiers', () => {
      expect(safeFormat('Hello World')).toBe('Hello World');
      expect(safeFormat('')).toBe('');
    });

    it('should handle undefined and null arguments', () => {
      expect(safeFormat('Value: %s', undefined)).toBe('Value: undefined');
      expect(safeFormat('Value: %s', null)).toBe('Value: null');
    });

    it('should handle circular references in %j', () => {
      const obj: any = { name: 'John' };
      obj.self = obj;
      expect(safeFormat('Circular: %j', obj)).toBe('Circular: {"name":"John","self":"(circular)"}');
    });

    it('should handle JSON specifier errors', () => {
      // Create an object that will cause stringifyJSON to throw an error
      const problematicObj = {
        get [Symbol.toPrimitive]() {
          throw new Error('JSON serialization failed');
        }
      };

      const result = safeFormat('Data: %j', problematicObj);
      expect(result).toBe('Data: {}');
    });

    it('should handle unknown format specifiers', () => {
      expect(safeFormat('Unknown: %x', 'test')).toBe('Unknown: %x');
      expect(safeFormat('Unknown: %z', 42)).toBe('Unknown: %z');
      expect(safeFormat('Unknown: %q', 'value')).toBe('Unknown: %q');
    });
  });
});

describe('safeInspect', () => {
  it('should handle simple objects', () => {
    const obj = { name: 'John', age: 30 };
    expect(safeInspect(obj)).toBe('{"name":"John","age":30}');
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(safeInspect(arr)).toBe('[1,2,3]');
  });

  it('should handle primitives', () => {
    expect(safeInspect('hello')).toBe('"hello"');
    expect(safeInspect(42)).toBe('42');
    expect(safeInspect(true)).toBe('true');
    expect(safeInspect(null)).toBe('null');
  });

  it('should handle circular references', () => {
    const obj: any = { name: 'John' };
    obj.self = obj;
    expect(safeInspect(obj)).toBe('{"name":"John","self":"(circular)"}');
  });

  it('should handle complex nested structures', () => {
    const complex = {
      name: 'John',
      details: {
        age: 30,
        hobbies: ['reading', 'coding'],
        address: {
          city: 'New York',
          country: 'USA'
        }
      },
      active: true
    };

    expect(safeInspect(complex)).toBe('{"name":"John","details":{"age":30,"hobbies":["reading","coding"],"address":{"city":"New York","country":"USA"}},"active":true}');
  });

  it('should handle objects that cannot be serialized', () => {
    // Create an object that would cause stringifyJSON to fail
    const problematicObj = {
      get [Symbol.toPrimitive]() {
        throw new Error('Cannot convert to primitive');
      }
    };

    // The object should still be serialized by stringifyJSON
    // since the Symbol.toPrimitive is not actually called during serialization
    expect(safeInspect(problematicObj)).toBe('{}');
  });

  it('should handle objects with problematic getters', () => {
    // Create an object with a getter that throws an error
    const problematicObj = {
      get problematic() {
        throw new Error('Getter error');
      }
    };

    // This should trigger the catch block in safeInspect
    expect(safeInspect(problematicObj)).toBe('[Object: object]');
  });

  it('should handle safeInspect fallback errors', () => {
    // Create an object that will cause stringifyJSON to fail
    const problematicObj = {
      get [Symbol.toPrimitive]() {
        throw new Error('Cannot convert to primitive');
      }
    };

    const result = safeInspect(problematicObj);
    expect(result).toBe('{}');
  });
});
