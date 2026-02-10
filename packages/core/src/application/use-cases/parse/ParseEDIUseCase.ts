import { ParseEDIInputDTO } from './ParseEDIInputDTO';
import { ParseEDIOutputDTO, ParseError } from './ParseEDIOutputDTO';
import { IMessageParser } from '@application/ports';
import { StructureMappingService } from '@application/services/StructureMappingService';

/**
 * Use Case for parsing EDI messages.
 * Coordinates with the infrastructure layer (message parsers) to parse EDI strings.
 *
 * Clean Architecture: This Use Case depends on IMessageParser (interface),
 * not on concrete implementations like EdifactMessageParser.
 *
 * Phase 1: EDI String → EDIMessage (Syntax Parsing)
 * Phase 2: EDIMessage → Business Object (Structure Mapping) - US-6.2
 */
export class ParseEDIUseCase {
  constructor(
    private readonly messageParser: IMessageParser,
    private readonly structureMappingService?: StructureMappingService  // Optional: for Phase 2
  ) {}

  execute(input: ParseEDIInputDTO): ParseEDIOutputDTO {
    try {
      // Validate input
      if (!input.message || input.message.trim().length === 0) {
        return this.createErrorResult(input, {
          code: 'EMPTY_MESSAGE',
          message: 'Message cannot be empty',
        });
      }

      // Check if parser can handle this message
      if (!this.messageParser.canParse(input.message)) {
        return this.createErrorResult(input, {
          code: 'UNSUPPORTED_FORMAT',
          message: `Parser does not support this message format`,
        });
      }

      // Phase 1: Syntax Parsing (EDI String → EDIMessage)
      const message = this.messageParser.parse(input.message, input.parserConfig);

      // Phase 2: Structure Mapping (EDIMessage → Business Object) - US-6.2
      // NOTE: Requires explicit messageStructure in input (cannot use async repository in sync method)
      let businessObject: any | undefined;

      if (input.returnTypedObject && input.messageStructure && this.structureMappingService) {
        businessObject = this.structureMappingService.map(message, input.messageStructure);
      }

      // Get parser configuration (includes detected delimiters)
      const parserConfig = this.messageParser.getConfiguration();

      // Return success result
      return {
        success: true,
        message,
        businessObject,  // Phase 2: Typed business object (if requested)
        metadata: {
          standard: message.standard,
          version: message.version,
          messageType: message.messageType,
          segmentCount: message.segments.length,
          delimiters: parserConfig.delimiters,  // Delimiters detected by parser
        },
      };
    } catch (error) {
      return this.createErrorResult(input, {
        code: 'PARSE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  private createErrorResult(input: ParseEDIInputDTO, error: ParseError): ParseEDIOutputDTO {
    return {
      success: false,
      errors: [error],
      metadata: {
        standard: input.standard,
        segmentCount: 0,
        delimiters: input.parserConfig?.delimiters,  // From parser config if provided
      },
    };
  }
}
