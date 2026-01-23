import type { IRepository } from '../ports';
import type { MessageType, Version, MessageDefinition } from '../../domain';

/**
 * Manages multiple repositories and provides a unified interface for finding message definitions.
 * Searches repositories in the order they were added, returning the first match found.
 */
export class RepositoryManager {
  private readonly repositories: IRepository[] = [];

  /**
   * Adds a repository to the manager.
   * Repositories are searched in the order they are added.
   *
   * @param repository - The repository to add
   */
  addRepository(repository: IRepository): void {
    this.repositories.push(repository);
  }

  /**
   * Finds a message definition by searching all registered repositories.
   * Returns the first match found.
   *
   * @param type - The message type to find
   * @param version - The version to find
   * @returns The message definition if found, null otherwise
   */
  findDefinition(type: MessageType, version: Version): MessageDefinition | null {
    for (const repository of this.repositories) {
      const definition = repository.getMessageDefinition(type, version);
      if (definition !== null) {
        return definition;
      }
    }
    return null;
  }

  /**
   * Checks if a definition exists in any registered repository.
   *
   * @param type - The message type to check
   * @param version - The version to check
   * @returns true if definition exists in any repository, false otherwise
   */
  hasDefinition(type: MessageType, version: Version): boolean {
    return this.findDefinition(type, version) !== null;
  }
}
