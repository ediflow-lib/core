import { ParseEDIInputDTO } from './ParseEDIInputDTO';
import { ParseEDIOutputDTO, ParseError } from './ParseEDIOutputDTO';
import { IDelimiterDetector, ITokenizer, IParser } from '../../ports';
import { StandardDelimiters } from '../../../domain';

export class ParseEDIUseCase {
  constructor(
    private readonly delimiterDetector: IDelimiterDetector,
    private readonly tokenizer: ITokenizer,
    private readonly parser: IParser
  ) {}

  execute(input: ParseEDIInputDTO): ParseEDIOutputDTO {
    try {
      if (!input.message || input.message.trim().length === 0) {
        return this.createErrorResult(input, {
          code: 'EMPTY_MESSAGE',
          message: 'Message cannot be empty',
        });
      }

      const delimiters = this.delimiterDetector.detect(input.message);
      const cleanMessage = this.delimiterDetector.getMessageWithoutFormatSpecificHeader(input.message);
      const segments = this.tokenizer.tokenize(cleanMessage, delimiters);
      const message = this.parser.parse(segments, delimiters);

      return {
        success: true,
        message,
        metadata: {
          standard: input.standard,
          version: message.version,
          messageType: message.messageType,
          segmentCount: segments.length,
          delimiters,
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
