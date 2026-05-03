import { ParseEDIUseCase } from '@application/use-cases/parse/ParseEDIUseCase';
import { BuildEDIUseCase } from '@application/use-cases/build/BuildEDIUseCase';
import { ValidateMessageUseCase } from '@application/use-cases/validate/ValidateMessageUseCase';
import { IMessageParser, IMessageBuilder, IValidationService } from '@application/ports';
import { StructureMappingService } from '@application/services/StructureMappingService';
import { EDIMessage } from '@domain/entities/EDIMessage';

/**
 * Factory for creating configured use cases.
 *
 * Centralizes use case instantiation with proper dependency injection.
 * Follows Clean Architecture - Application Layer coordinates between
 * Ports (interfaces) without knowing Infrastructure implementations.
 *
 * @example
 * ```typescript
 * const factory = new UseCaseFactory(parsers, builders, validationService);
 * const parseUseCase = factory.createParseUseCase('EDIFACT');
 * const buildUseCase = factory.createBuildUseCase('EDIFACT');
 * ```
 */
export class UseCaseFactory {
  constructor(
    private readonly parsers: Map<string, IMessageParser>,
    private readonly builders: Map<string, IMessageBuilder>,
    private readonly validationService: IValidationService<EDIMessage>
  ) {}

  /**
   * Creates a ParseEDIUseCase with the appropriate parser.
   *
   * @param standard - EDI standard (e.g., 'EDIFACT', 'X12')
   * @param mapper
   * @returns Configured ParseEDIUseCase
   * @throws Error if standard is not supported
   */
  createParseUseCase(standard: string, mapper?: StructureMappingService): ParseEDIUseCase {
    const parser = this.parsers.get(standard.toUpperCase());
    if (!parser) {
      throw new Error(`No parser registered for standard: ${standard}`);
    }
    return new ParseEDIUseCase(parser, mapper);
  }

  /**
   * Creates a BuildEDIUseCase with the appropriate builder.
   *
   * @param standard - EDI standard (e.g., 'EDIFACT', 'X12')
   * @returns Configured BuildEDIUseCase
   * @throws Error if standard is not supported
   */
  createBuildUseCase(standard: string, mapper?: StructureMappingService): BuildEDIUseCase {
    const builder = this.builders.get(standard.toUpperCase());
    if (!builder) {
      throw new Error(`No builder registered for standard: ${standard}`);
    }
    return new BuildEDIUseCase(builder, undefined, mapper);
  }

  /**
   * Creates a ValidateMessageUseCase.
   *
   * @returns Configured ValidateMessageUseCase
   */
  createValidateUseCase(): ValidateMessageUseCase {
    return new ValidateMessageUseCase(this.validationService);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Gets list of supported standards.
   *
   * @returns Array of standard names
   */
  getSupportedStandards(): string[] {
    return Array.from(this.parsers.keys());
  }
}
