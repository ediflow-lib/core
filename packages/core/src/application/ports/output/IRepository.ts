import type { MessageType, Version, Standard } from '@domain';
import type { MessageDefinition } from '@domain/repositories/MessageDefinition';

/**
 * Legacy Repository interface for storing and retrieving message definitions.
 * Uses flat structure (segments array instead of Composite Pattern).
 *
 * @deprecated Use IMessageStructureRepository for new implementations
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
  hasMessageDefinition(type: MessageType, version: Version): boolean;

  /**
   * Returns the EDI standard this repository supports.
   * Each repository supports exactly one standard (e.g., EDIFACT or X12).
   *
   * @returns The supported standard
   */
  getStandard(): Standard;

  /**
   * Returns all versions this repository supports for its standard.
   * A repository can support multiple versions of the same standard.
   *
   * @returns Array of supported versions (e.g., [D.96A, D.20B] for EDIFACT)
   */
  getVersions(): Version[];
}
