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
  getMessageStructure(
    standard: string,
    version: string,
    messageType: string
  ): Promise<MessageStructureDTO | null>;

  getAllMessageTypes(standard: string, version: string): Promise<string[]>;

  hasMessageStructure(
    standard: string,
    version: string,
    messageType: string
  ): Promise<boolean>;

  /**
   * Opt-in: Load a code list for code value validation.
   * Returns null if the code list is not available in this package.
   */
  getCodeList(
    standard: string,
    version: string,
    codeListCode: string
  ): Promise<Set<string> | null>;
}
