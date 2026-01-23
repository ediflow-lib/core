import type { MessageType, Version, MessageDefinition } from '../../domain';
import type { IRepository } from '../../application';

/**
 * In-memory implementation of the repository interface.
 * Stores message definitions in a Map for fast retrieval.
 * Suitable for testing and simple use cases.
 */
export class InMemoryRepository implements IRepository {
  private readonly definitions = new Map<string, MessageDefinition>();

  /**
   * Registers a message definition in the repository.
   * If a definition with the same type and version exists, it will be overwritten.
   *
   * @param definition - The message definition to register
   */
  register(definition: MessageDefinition): void {
    const key = this.createKey(definition.messageType, definition.version);
    this.definitions.set(key, definition);
  }

  /**
   * Retrieves a message definition for a specific type and version.
   *
   * @param type - The message type to retrieve
   * @param version - The version of the message definition
   * @returns The message definition if found, null otherwise
   */
  getMessageDefinition(type: MessageType, version: Version): MessageDefinition | null {
    const key = this.createKey(type, version);
    return this.definitions.get(key) ?? null;
  }

  /**
   * Checks if a definition exists for a specific type and version.
   *
   * @param type - The message type to check
   * @param version - The version to check
   * @returns true if definition exists, false otherwise
   */
  hasDefinition(type: MessageType, version: Version): boolean {
    const key = this.createKey(type, version);
    return this.definitions.has(key);
  }

  /**
   * Creates a unique key for storing/retrieving definitions.
   * Format: "STANDARD:TYPE:VERSION"
   * Example: "EDIFACT:ORDERS:D.96A"
   *
   * @private
   */
  private createKey(type: MessageType, version: Version): string {
    return `${type.standard}:${type.value}:${version.value}`;
  }
}
