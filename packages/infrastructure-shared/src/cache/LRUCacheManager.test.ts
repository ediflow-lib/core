import { describe, it, expect, beforeEach } from 'vitest';
import { LRUCacheManager } from './LRUCacheManager';

describe('LRUCacheManager', () => {
  let cache: LRUCacheManager<string>;

  beforeEach(() => {
    cache = new LRUCacheManager<string>(3); // Small size for testing eviction
  });

  describe('get and set', () => {
    it('should return undefined for non-existent key', () => {
      const result = cache.get('non-existent');
      expect(result).toBeUndefined();
    });

    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      const result = cache.get('key1');
      expect(result).toBe('value1');
    });

    it('should update existing value', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      const result = cache.get('key1');
      expect(result).toBe('value2');
    });
  });

  describe('has', () => {
    it('should return false for non-existent key', () => {
      expect(cache.has('key1')).toBe(false);
    });

    it('should return true for existing key', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });
  });

  describe('size', () => {
    it('should return 0 for empty cache', () => {
      expect(cache.size()).toBe(0);
    });

    it('should return correct size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used item when cache is full', () => {
      // Fill cache to max (3 items)
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // All should exist
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.size()).toBe(3);

      // Add 4th item - should evict key1 (oldest)
      cache.set('key4', 'value4');

      expect(cache.has('key1')).toBe(false); // Evicted!
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
      expect(cache.size()).toBe(3);
    });

    it('should update LRU order on get', () => {
      // Fill cache
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Access key1 - makes it recently used
      cache.get('key1');

      // Add key4 - should evict key2 (now oldest, not key1)
      cache.set('key4', 'value4');

      expect(cache.has('key1')).toBe(true); // Still exists!
      expect(cache.has('key2')).toBe(false); // Evicted
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all items from cache', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.size()).toBe(3);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(false);
    });
  });

  describe('default cache size', () => {
    it('should use default size of 100 when not specified', () => {
      const defaultCache = new LRUCacheManager<string>();

      // Fill with 100 items
      for (let i = 0; i < 100; i++) {
        defaultCache.set(`key${i}`, `value${i}`);
      }

      expect(defaultCache.size()).toBe(100);

      // 101st item should evict oldest
      defaultCache.set('key100', 'value100');
      expect(defaultCache.size()).toBe(100);
      expect(defaultCache.has('key0')).toBe(false); // First one evicted
    });
  });
});
