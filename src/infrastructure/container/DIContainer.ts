import { UseCaseFactory } from '@application/factories';
import { RepositoryManager } from '@application/services/RepositoryManager';
import { EDIMessageValidationService } from '@application/services/EDIMessageValidationService';
import { IMessageParser } from '@application/ports';
import { InMemoryRepository } from '@infrastructure/repositories/InMemoryRepository';
import { EdifactMessageParser } from '@infrastructure/parsers/edifact/EdifactMessageParser';
import { EdifactDelimiterDetector } from '@infrastructure/parsers/edifact/EdifactDelimiterDetector';
import { EdifactTokenizer } from '@infrastructure/parsers/edifact/EdifactTokenizer';
import { EdifactSegmentParser } from '@infrastructure/parsers/edifact/EdifactSegmentParser';

/**
 * Dependency Injection Container
 *
 * Bootstraps and wires all dependencies according to Clean Architecture.
 * Infrastructure layer creates concrete implementations and injects them
 * into Application Layer factories/services.
 *
 * Layer Flow:
 * - Infrastructure (this file) -> creates implementations
 * - Application (UseCaseFactory) -> coordinates use cases
 * - Presentation (CLI) -> receives configured use cases
 *
 * @example
 * ```typescript
 * const container = new DIContainer();
 * const parseUseCase = container.useCaseFactory.createParseUseCase('EDIFACT');
 * ```
 */
export class DIContainer {
  private readonly _parsers: Map<string, IMessageParser>;
  private readonly _repositoryManager: RepositoryManager;
  private readonly _validationService: EDIMessageValidationService;
  private readonly _useCaseFactory: UseCaseFactory;

  constructor() {
    this._parsers = this.createParsers();
    this._repositoryManager = this.createRepositoryManager();
    this._validationService = this.createValidationService();

    this._useCaseFactory = new UseCaseFactory(
      this._parsers,
      this._validationService
    );
  }

  /**
   * Gets the UseCaseFactory for creating use cases.
   */
  get useCaseFactory(): UseCaseFactory {
    return this._useCaseFactory;
  }

  /**
   * Gets the RepositoryManager.
   */
  get repositoryManager(): RepositoryManager {
    return this._repositoryManager;
  }

  /**
   * Creates and registers all message parsers.
   */
  private createParsers(): Map<string, IMessageParser> {
    const parsers = new Map<string, IMessageParser>();

    // EDIFACT Parser
    const edifactParser = new EdifactMessageParser(
      new EdifactDelimiterDetector(),
      new EdifactTokenizer(),
      new EdifactSegmentParser()
    );
    parsers.set('EDIFACT', edifactParser);

    // TODO: Add X12 parser when implemented
    // parsers.set('X12', x12Parser);

    return parsers;
  }

  /**
   * Creates RepositoryManager with registered repositories.
   */
  private createRepositoryManager(): RepositoryManager {
    const manager = new RepositoryManager();

    // Create and add EDIFACT repository
    // TODO: Load actual definitions and register them
    const edifactRepo = new InMemoryRepository();
    // edifactRepo.register(definition); // Register actual definitions when available

    manager.addRepository(edifactRepo);

    return manager;
  }

  /**
   * Creates the validation service.
   */
  private createValidationService(): EDIMessageValidationService {
    return new EDIMessageValidationService();
  }
}

/**
 * Singleton instance of the DI Container.
 * Use this for application-wide dependency access.
 */
export const container = new DIContainer();
