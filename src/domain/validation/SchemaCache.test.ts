import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaCache } from './SchemaCache';
import type { JSONSchema } from './JSONSchema';

describe('SchemaCache', () => {
  let cache: SchemaCache;

  beforeEach(() => {
    cache = new SchemaCache();
  });

  describe('Memory Cache', () => {
    it('should store and retrieve schema from memory cache', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          documentNumber: { type: 'string' }
        }
      };
      const cacheKey = 'test-key-1';

      cache.set(cacheKey, schema);
      const retrieved = cache.get(cacheKey);

      expect(retrieved).toEqual(schema);
    });

    it('should return undefined for non-existent key', () => {
      const result = cache.get('non-existent-key');
      expect(result).toBeUndefined();
    });

    it('should overwrite existing key', () => {
      const schema1: JSONSchema = { type: 'string' };
      const schema2: JSONSchema = { type: 'number' };
      const cacheKey = 'test-key';

      cache.set(cacheKey, schema1);
      cache.set(cacheKey, schema2);

      expect(cache.get(cacheKey)).toEqual(schema2);
    });

    it('should clear all cached schemas', () => {
      cache.set('key1', { type: 'string' });
      cache.set('key2', { type: 'number' });

      cache.clear();

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });

    it('should check if key exists', () => {
      const schema: JSONSchema = { type: 'object' };
      cache.set('test-key', schema);

      expect(cache.has('test-key')).toBe(true);
      expect(cache.has('non-existent')).toBe(false);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent SHA-256 hash for same input', () => {
      const input = JSON.stringify({ test: 'data' });
      const key1 = SchemaCache.generateCacheKey(input);
      const key2 = SchemaCache.generateCacheKey(input);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 = 64 hex chars
    });

    it('should generate different hash for different input', () => {
      const input1 = JSON.stringify({ test: 'data1' });
      const input2 = JSON.stringify({ test: 'data2' });

      const key1 = SchemaCache.generateCacheKey(input1);
      const key2 = SchemaCache.generateCacheKey(input2);

      expect(key1).not.toBe(key2);
    });
  });
});
