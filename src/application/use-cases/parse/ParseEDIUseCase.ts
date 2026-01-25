import { ParseEDIInputDTO } from './ParseEDIInputDTO';
import { ParseEDIOutputDTO, ParseError } from './ParseEDIOutputDTO';
import { IMessageParser } from '@application/ports';
import { StandardDelimiters } from '@domain';

/**
 * Use Case for parsing EDI messages.
 * Coordinates with the infrastructure layer (message parsers) to parse EDI strings.
 *
 * Clean Architecture: This Use Case depends on IMessageParser (interface),
 * not on concrete implementations like EdifactMessageParser.
 */
export class ParseEDIUseCase {
  constructor(
    private readonly messageParser: IMessageParser
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

      // Parse the message using infrastructure
      const message = this.messageParser.parse(input.message, input.parserConfig);

      // Return success result
      return {
        success: true,
        message,
        metadata: {
          standard: message.standard,
          version: message.version,
          messageType: message.messageType,
          segmentCount: message.segments.length,
          delimiters: StandardDelimiters.getDefault(message.standard),
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
        delimiters: StandardDelimiters.getDefault(input.standard),
      },
    };
  }
}
