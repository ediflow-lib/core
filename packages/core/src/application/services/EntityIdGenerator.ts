/**
 * EntityIdGenerator Application Service
 *
 * Generates unique IDs for domain entities.
 * Uses crypto.randomUUID() for RFC4122-compliant UUIDs.
 *
 * Application Service: Handles technical concerns (UUID generation)
 * that don't belong in pure Domain layer.
 */
export class EntityIdGenerator {
  /**
   * Generates a new unique ID (UUID v4).
   * @returns A unique identifier string
   */
  static generate(): string {
    return crypto.randomUUID();
  }
}
