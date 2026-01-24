import { IDefinitionLoader } from '@application/ports';
import { RepositoryManager } from '@application/services/RepositoryManager';
import { Standard, Version, MessageType } from '@domain';
import { MessageDefinition } from '@domain/repositories/MessageDefinition';
import { DefinitionNotFoundError } from '@domain/errors/DefinitionNotFoundError';

/**
 * Loads message definitions from registered repositories.
 *
 * This is the infrastructure implementation of IDefinitionLoader.
 * It uses RepositoryManager to find the appropriate repository,
 * then loads the definition from that repository.
 */
export class DefinitionLoader implements IDefinitionLoader {
  constructor(private readonly repositoryManager: RepositoryManager) {}

  /**
   * Loads a message definition for the given parameters.
   *
   * @throws DefinitionNotFoundError if no repository or definition exists
   */
  loadDefinition(
    standard: Standard,
    version: Version,
    messageType: MessageType
  ): MessageDefinition {
    // Find repository that supports this standard and version
    const repository = this.repositoryManager.findRepository(standard, version);

    if (!repository) {
      throw new DefinitionNotFoundError(standard, version, messageType);
    }

    // Load definition from repository
    const definition = repository.getMessageDefinition(messageType, version);

    if (!definition) {
      throw new DefinitionNotFoundError(standard, version, messageType);
    }

    return definition;
  }

  /**
   * Checks if a definition exists without throwing an error.
   */
  hasDefinition(
    standard: Standard,
    version: Version,
    messageType: MessageType
  ): boolean {
    try {
      const repository = this.repositoryManager.findRepository(standard, version);

      if (!repository) {
        return false;
      }

      return repository.hasMessageDefinition(messageType, version);
    } catch {
      return false;
    }
  }
}
