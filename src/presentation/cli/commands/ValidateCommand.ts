import { Command } from 'commander';
import { UseCaseFactory } from '@application/factories';
import { Standard } from '@domain/value-objects/Standard';
import { readEDIFile, OutputFormatter, ErrorHandler } from '../utils';

/**
 * Validate Command - CLI handler for validating EDI files.
 *
 * Clean Architecture: Presentation Layer
 */
export class ValidateCommand {
  constructor(
    private readonly useCaseFactory: UseCaseFactory
  ) {}

  register(program: Command): void {
    program
      .command('validate')
      .description('Validate an EDI file')
      .argument('<file>', 'EDI file path')
      .option('-s, --standard <standard>', 'EDI standard (EDIFACT, X12)', undefined)
      .option('-f, --format <format>', 'Output format (json, yaml)', 'json')
      .option('-o, --output <file>', 'Output file path', undefined)
      .action(async (file: string, options) => {
        try {
          await this.execute(file, options);
          process.exit(0);
        } catch (error) {
          console.error(ErrorHandler.format(error as Error));
          process.exit(1);
        }
      });
  }

  private async execute(file: string, options: any): Promise<void> {
    const content = readEDIFile(file);
    const standardStr = options.standard || this.detectStandard(content);
    const standardEnum = this.parseStandard(standardStr);

    const parseUseCase = this.useCaseFactory.createParseUseCase(standardStr);
    const parseResult = parseUseCase.execute({
      message: content,
      standard: standardEnum,
    });

    if (!parseResult.success || !parseResult.message) {
      throw new Error('Cannot validate: Message parsing failed');
    }

    const validateUseCase = this.useCaseFactory.createValidateUseCase();
    const result = validateUseCase.execute({
      message: parseResult.message,
    });

    if (!result.success) {
      throw new Error(ErrorHandler.formatMultiple(result.errors));
    }

    const outputData = {
      valid: result.validationResult.isValid,
      errors: result.validationResult.errors,
      metadata: {
        standard: parseResult.message.standard.toString(),
        version: parseResult.message.version?.toString(),
        messageType: parseResult.message.messageType?.toString(),
      },
    };

    const outputContent = options.format === 'yaml'
      ? OutputFormatter.toYAML(outputData)
      : OutputFormatter.toJSON(outputData);

    OutputFormatter.output(outputContent, options.output);

    if (!result.validationResult.isValid) {
      console.error(ErrorHandler.formatValidation(result.validationResult.errors));
      process.exit(1);
    }
  }

  private detectStandard(content: string): string {
    if (content.startsWith('UNB') || content.startsWith('UNA')) {
      return 'EDIFACT';
    }
    if (content.startsWith('ISA')) {
      return 'X12';
    }
    throw new Error('Unable to detect EDI standard. Please specify with --standard flag.');
  }

  private parseStandard(standardStr: string): Standard {
    const upper = standardStr.toUpperCase();
    if (upper === 'EDIFACT') return Standard.EDIFACT;
    if (upper === 'X12') return Standard.X12;
    throw new Error(`Unsupported standard: ${standardStr}`);
  }
}
