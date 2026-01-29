import { MessageDefinition } from '@domain/repositories/MessageDefinition';
import { Standard, Version, MessageType } from '@domain';

/**
 * Port for loading message definitions from repositories.
 *
 * This is an output port (driven adapter) - the Application Layer
 * defines the interface, Infrastructure provides implementation.
 */
export interface IDefinitionLoader {
  /**
   * Loads a message definition for a specific standard, version, and message type.
   *
   * @param standard - The EDI standard (e.g., EDIFACT, X12)
   * @param version - The version (e.g., D.96A, D.20B)
   * @param messageType - The message type (e.g., ORDERS, INVOIC)
   * @returns The message definition with segment structures
   * @throws DefinitionNotFoundError if no definition exists
   */
  loadDefinition(
    standard: Standard,
    version: Version,
    messageType: MessageType
  ): MessageDefinition;

  /**
   * Checks if a definition exists for the given parameters.
   *
   * @param standard - The EDI standard
   * @param version - The version
   * @param messageType - The message type
   * @returns true if a definition exists, false otherwise
   */
  hasDefinition(
    standard: Standard,
    version: Version,
    messageType: MessageType
  ): boolean;
}
