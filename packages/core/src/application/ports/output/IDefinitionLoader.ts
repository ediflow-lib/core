import type {Standard, Version, MessageType} from '@domain';
import type {MessageStructureDTO} from '@infrastructure/repositories/dtos';

/**
 * Port for loading message structure definitions from repositories.
 *
 * This is an output port (driven adapter) - the Application Layer
 * defines the interface, Infrastructure provides implementation.
 *
 * Clean Architecture:
 * - Port (Application Layer Interface)
 * - Implementation: DefinitionLoader (Infrastructure Layer)
 */
export interface IDefinitionLoader {
  /**
   * Loads a message structure definition for a specific standard, version, and message type.
   *
   * @param standard - The EDI standard (e.g., EDIFACT, X12)
   * @param version - The version (e.g., D.96A, 005010)
   * @param messageType - The message type (e.g., ORDERS, 850)
   * @returns Promise resolving to the message structure definition
   * @throws DefinitionNotFoundError if no definition exists
   */
  loadDefinition(
    standard: Standard,
    version: Version,
    messageType: MessageType
  ): Promise<MessageStructureDTO>;

  /**
   * Checks if a definition exists for the given parameters.
   *
   * @param standard - The EDI standard
   * @param version - The version
   * @param messageType - The message type
   * @returns Promise resolving to true if definition exists, false otherwise
   */
  hasDefinition(
    standard: Standard,
    version: Version,
    messageType: MessageType
  ): Promise<boolean>;
}
