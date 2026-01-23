import type { MessageType, Version, MessageDefinition } from '../../../domain';

/**
 * Repository interface for storing and retrieving message definitions.
 * Implementations can store definitions in memory, files, databases, etc.
 */
export interface IRepository {
  /**
   * Retrieves a message definition for a specific type and version.
   *
   * @param type - The message type to retrieve
   * @param version - The version of the message definition
   * @returns The message definition if found, null otherwise
   */
  getMessageDefinition(type: MessageType, version: Version): MessageDefinition | null;

  /**
   * Checks if a definition exists for a specific type and version.
   *
   * @param type - The message type to check
   * @param version - The version to check
   * @returns true if definition exists, false otherwise
   */
  hasDefinition(type: MessageType, version: Version): boolean;
}
