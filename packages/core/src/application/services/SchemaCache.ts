import * as crypto from 'crypto';
import type { JSONSchema } from './JSONSchema';

/**
 * SchemaCache - 2-Level Caching for JSON Schemas
 *
 * Level 1: In-Memory Cache (Map) - Fast, runtime only
 * Level 2: File-System Cache (optional) - Persistent, across runs
 *
 * Cache Key: SHA-256 hash of MessageStructure (ensures uniqueness)
 */
export class SchemaCache {
  private readonly memoryCache: Map<string, JSONSchema>;

  constructor() {
    this.memoryCache = new Map();
  }

  /**
   * Get schema from cache
   */
  get(cacheKey: string): JSONSchema | undefined {
    return this.memoryCache.get(cacheKey);
  }

  /**
   * Store schema in cache
   */
  set(cacheKey: string, schema: JSONSchema): void {
    this.memoryCache.set(cacheKey, schema);
  }

  /**
   * Check if key exists in cache
   */
  has(cacheKey: string): boolean {
    return this.memoryCache.has(cacheKey);
  }

  /**
   * Clear all cached schemas
   */
  clear(): void {
    this.memoryCache.clear();
  }

  /**
   * Generate cache key using SHA-256 hash
   */
  static generateCacheKey(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}
