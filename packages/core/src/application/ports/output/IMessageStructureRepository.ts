import type { MessageStructureDTO } from '@application/dtos';

/**
 * Port: Message Structure Repository
 *
 * Output Port for fetching EDI message structure definitions.
 * Infrastructure layer provides Adapters (FileBasedRepository, etc.)
 *
 * Clean Architecture:
 * - This is a PORT (Application Layer Interface)
 * - NOT a Domain concept!
 * - Implementations are ADAPTERS (Infrastructure Layer)
 */
export interface IMessageStructureRepository {
  getMessageDefinition(
    standard: string,
    version: string,
    messageType: string
  ): Promise<MessageStructureDTO | null>;

  getAllMessageTypes(standard: string, version: string): Promise<string[]>;

  hasMessageDefinition(
    standard: string,
    version: string,
    messageType: string
  ): Promise<boolean>;
}
