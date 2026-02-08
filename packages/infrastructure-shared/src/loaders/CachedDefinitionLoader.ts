import type {
  IDefinitionLoader,
  IMessageStructureRepository,
  Standard,
  Version,
  MessageType,
  MessageStructureDTO
} from '@ediflow/core';
import { DefinitionNotFoundError } from '@ediflow/core';
import { LRUCacheManager } from '../cache/LRUCacheManager';

/**
 * CachedDefinitionLoader
 *
 * Loads message structure definitions from a repository with LRU caching.
 *
 * Caching significantly improves performance when the same definitions
 * are loaded repeatedly (e.g., processing 1000 ORDERS messages).
 * - Without cache: ~1-5ms per load
 * - With cache: ~0.01ms (100x faster!)
 *
 * Shared Infrastructure:
 * - Used by EDIFACT and X12 packages
 * - Generic cache implementation (LRU)
 * - Works with any IMessageStructureRepository
 */
export class CachedDefinitionLoader implements IDefinitionLoader {
  private readonly cache: LRUCacheManager<MessageStructureDTO>;

  constructor(
    private readonly repository: IMessageStructureRepository,
    cacheSize: number = 100
  ) {
    this.cache = new LRUCacheManager(cacheSize);
  }

  /**
   * Loads a message structure definition for the given parameters.
   * Checks cache first, then loads from repository if not cached.
   */
  async loadDefinition(
    standard: Standard,
    version: Version,
    messageType: MessageType
  ): Promise<MessageStructureDTO> {
    // Create cache key
    const cacheKey = this.createCacheKey(standard, version, messageType);

    // Try cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - load from repository
    const definition = await this.loadFromRepository(standard, version, messageType);

    // Store in cache for future requests
    this.cache.set(cacheKey, definition);

    return definition;
  }

  /**
   * Loads definition from repository (no caching).
   */
  private async loadFromRepository(
    standard: Standard,
    version: Version,
    messageType: MessageType
  ): Promise<MessageStructureDTO> {
    const definition = await this.repository.getMessageDefinition(
      standard.toString(),
      version.value,
      messageType.value
    );

    if (!definition) {
      throw new DefinitionNotFoundError(standard, version, messageType);
    }

    return definition;
  }

  /**
   * Checks if a definition exists without throwing an error.
   * Checks cache first for performance.
   */
  async hasDefinition(
    standard: Standard,
    version: Version,
    messageType: MessageType
  ): Promise<boolean> {
    // Check cache first
    const cacheKey = this.createCacheKey(standard, version, messageType);
    if (this.cache.has(cacheKey)) {
      return true;
    }

    // Not in cache - check repository
    return await this.repository.hasMessageDefinition(
      standard.toString(),
      version.value,
      messageType.value
    );
  }

  /**
   * Creates a cache key from standard, version, and message type.
   * Format: "STANDARD:VERSION:MESSAGETYPE"
   */
  private createCacheKey(
    standard: Standard,
    version: Version,
    messageType: MessageType
  ): string {
    return `${standard.toString()}:${version.value}:${messageType.value}`;
  }

  /**
   * Clears the definition cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Returns the current cache size.
   */
  getCacheSize(): number {
    return this.cache.size();
  }
}
