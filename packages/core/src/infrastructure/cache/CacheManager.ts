import { LRUCache } from 'lru-cache';

/**
 * Generic cache manager using LRU (Least Recently Used) eviction strategy.
 *
 * Provides O(1) get/set operations with automatic eviction of least recently
 * used items when the cache reaches its maximum size.
 *
 * @template T - The type of values stored in the cache
 *
 * @example
 * ```typescript
 * const cache = new CacheManager<MessageDefinition>(100);
 *
 * // Store value
 * cache.set('EDIFACT:D.96A:ORDERS', definition);
 *
 * // Retrieve value
 * const cached = cache.get('EDIFACT:D.96A:ORDERS');
 * ```
 */
export class CacheManager<T extends {} = {}> {
  private readonly cache: LRUCache<string, T>;

  /**
   * Creates a new cache manager.
   *
   * @param maxSize - Maximum number of items to store (default: 100)
   */
  constructor(maxSize: number = 100) {
    this.cache = new LRUCache<string, T>({ max: maxSize });
  }

  /**
   * Retrieves a value from the cache.
   * Updates the item's position (marks as recently used).
   *
   * @param key - The cache key
   * @returns The cached value, or undefined if not found
   */
  get(key: string): T | undefined {
    return this.cache.get(key);
  }

  /**
   * Stores a value in the cache.
   * If the cache is full, evicts the least recently used item.
   *
   * @param key - The cache key
   * @param value - The value to store
   */
  set(key: string, value: T): void {
    this.cache.set(key, value);
  }

  /**
   * Checks if a key exists in the cache.
   * Does NOT update the item's position (unlike get).
   *
   * @param key - The cache key
   * @returns true if the key exists, false otherwise
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Returns the current number of items in the cache.
   *
   * @returns The cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Removes all items from the cache.
   */
  clear(): void {
    this.cache.clear();
  }
}
