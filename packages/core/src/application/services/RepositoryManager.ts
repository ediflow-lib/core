import type {IMessageStructureRepository} from '@application/ports/output/IMessageStructureRepository';
import type {MessageStructureDTO} from '@infrastructure/repositories/dtos';
import type {Standard, Version} from '@domain';

/**
 * RepositoryManager
 *
 * Manages multiple IMessageStructureRepository instances and provides
 * a unified interface for finding message structure definitions.
 * Searches repositories in the order they were added, returning the first match found.
 *
 * Clean Architecture:
 * - Application Service
 * - Orchestrates multiple repositories
 * - Provides fallback mechanism (searches in order)
 */
export class RepositoryManager {
    private readonly repositories: IMessageStructureRepository[] = [];

    /**
     * Adds a repository to the manager.
     * Repositories are searched in the order they are added.
     *
     * @param repository - The repository to add
     */
    addRepository(repository: IMessageStructureRepository): void {
        this.repositories.push(repository);
    }

    /**
     * Finds a repository that has definitions for the given standard and version.
     *
     * @param standard - The EDI standard (e.g., EDIFACT, X12)
     * @param version - The version (e.g., D.96A, 005010)
     * @returns Promise resolving to the first repository that has messages for this standard/version, null otherwise
     */
    async findRepository(standard: Standard, version: Version): Promise<IMessageStructureRepository | null> {
        for (const repository of this.repositories) {
            // Check if repository has any messages for this standard/version
            // We do a quick check by trying to get all message types
            const messageTypes = await repository.getAllMessageTypes(standard.toString(), version.value);
            if (messageTypes && messageTypes.length > 0) {
                return repository;
            }
        }
        return null;
    }

    /**
     * Finds a message structure definition by searching all registered repositories.
     * Returns the first match found.
     *
     * @param standard - The EDI standard
     * @param version - The version
     * @param messageType - The message type code
     * @returns Promise resolving to the message structure if found, null otherwise
     */
    async findDefinition(
        standard: Standard,
        version: Version,
        messageType: string
    ): Promise<MessageStructureDTO | null> {
        for (const repository of this.repositories) {
            const definition = await repository.getMessageDefinition(
                standard.toString(),
                version.value,
                messageType
            );
            if (definition !== null) {
                return definition;
            }
        }
        return null;
    }

    /**
     * Checks if a definition exists in any registered repository.
     *
     * @param standard - The EDI standard
     * @param version - The version
     * @param messageType - The message type code
     * @returns Promise resolving to true if definition exists, false otherwise
     */
    async hasDefinition(
        standard: Standard,
        version: Version,
        messageType: string
    ): Promise<boolean> {
        for (const repository of this.repositories) {
            const exists = await repository.hasMessageDefinition(
                standard.toString(),
                version.value,
                messageType
            );
            if (exists) {
                return true;
            }
        }
        return false;
    }
}
