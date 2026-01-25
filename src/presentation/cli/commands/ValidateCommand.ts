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
      .option('-f, --format <format>', 'Output format (json, text, table)', 'json')
      .option('-o, --output <file>', 'Output file path', undefined)
      .option('--strict', 'Enable strict validation mode', false)
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

  private async execute(file: string, options: any): Promise<any> {
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
      strictMode: options.strict || false,
    });

    if (!result.success) {
      throw new Error(ErrorHandler.formatMultiple(result.errors));
    }

    const outputData = this.formatValidationResult(
      result.validationResult,
      parseResult.message
    );

    const outputContent = this.formatOutput(outputData, options.format || 'json');

    OutputFormatter.output(outputContent, options.output);

    if (!result.validationResult.isValid) {
      console.error(ErrorHandler.formatValidation(result.validationResult.errors));
      process.exit(1);
    }

    return outputData;
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

  private formatValidationResult(validationResult: any, message: any): any {
    return {
      valid: validationResult.isValid,
      errors: validationResult.errors,
      metadata: {
        standard: message.standard.toString(),
        version: message.version?.toString(),
        messageType: message.messageType?.toString(),
      },
    };
  }

  private formatOutput(data: any, format: string): string {
    switch (format.toLowerCase()) {
      case 'text':
        return this.formatAsText(data);
      case 'table':
        return this.formatAsTable(data);
      case 'json':
      default:
        return OutputFormatter.toJSON(data);
    }
  }

  private formatAsText(data: any): string {
    const lines: string[] = [];

    if (data.valid) {
      lines.push(`✓ Valid ${data.metadata.standard} ${data.metadata.version || ''} ${data.metadata.messageType || ''} message`.trim());
      lines.push(`  - 0 errors`);
      lines.push(`  - 0 warnings`);
    } else {
      lines.push(`✗ Invalid ${data.metadata.standard} message`);
      lines.push('');
      lines.push('Errors:');
      data.errors.forEach((error: any, index: number) => {
        const field = error.field ? ` (${error.field})` : '';
        const code = error.code ? `[${error.code}]` : '';
        lines.push(`  ${index + 1}. ${code}${field} ${error.message}`);
      });
    }

    return lines.join('\n');
  }

  private formatAsTable(data: any): string {
    if (data.valid) {
      return this.formatAsText(data);
    }

    const lines: string[] = [];
    lines.push(`✗ Invalid ${data.metadata.standard} message`);
    lines.push('');
    lines.push('┌─────────────────────────────────────────────────────────────────────────────┐');
    lines.push('│ Code                │ Field       │ Message                                │');
    lines.push('├─────────────────────────────────────────────────────────────────────────────┤');

    data.errors.forEach((error: any) => {
      const code = (error.code || 'ERROR').padEnd(19);
      const field = (error.field || '-').padEnd(11);
      const message = error.message.length > 38
        ? error.message.substring(0, 35) + '...'
        : error.message.padEnd(38);
      lines.push(`│ ${code} │ ${field} │ ${message} │`);
    });

    lines.push('└─────────────────────────────────────────────────────────────────────────────┘');
    lines.push('');
    lines.push(`Total errors: ${data.errors.length}`);

    return lines.join('\n');
  }
}
