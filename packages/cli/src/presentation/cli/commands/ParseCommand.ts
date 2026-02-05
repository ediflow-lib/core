import { Command } from 'commander';
import { UseCaseFactory } from '@ediflow/core';
import { Standard } from '@ediflow/core';
import { ParserConfig, DEFAULT_PARSER_CONFIG } from '@ediflow/core';
import { readEDIFile, OutputFormatter, ErrorHandler } from '../utils';

/**
 * Parse Command - CLI handler for parsing EDI files.
 *
 * Clean Architecture: Presentation Layer
 * - Receives UseCaseFactory via DI
 * - Transforms CLI input to Use Case DTO
 * - Formats output for CLI presentation
 */
export class ParseCommand {
  constructor(
    private readonly useCaseFactory: UseCaseFactory
  ) {}

  register(program: Command): void {
    program
      .command('parse')
      .description('Parse an EDI file')
      .argument('<file>', 'EDI file path')
      .option('-s, --standard <standard>', 'EDI standard (EDIFACT, X12)', undefined)
      .option('-f, --format <format>', 'Output format (json, yaml)', 'json')
      .option('-o, --output <file>', 'Output file path', undefined)
      .option('--property-parse-mode <mode>', 'Property parsing mode (code, name)', 'code')
      .option('--codelist-value-parse-mode <mode>', 'CodeList value parsing mode (code, name)', 'code')
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

    const parserConfig: ParserConfig = {
      propertyParseMode: options.propertyParseMode || DEFAULT_PARSER_CONFIG.propertyParseMode,
      codeListValueParseMode: options.codelistValueParseMode || DEFAULT_PARSER_CONFIG.codeListValueParseMode,
    };

    const useCase = this.useCaseFactory.createParseUseCase(standardStr);
    const result = useCase.execute({
      message: content,
      standard: standardEnum,
      parserConfig,
    });

    if (!result.success) {
      if (result.errors && result.errors.length > 0) {
        throw new Error(ErrorHandler.formatMultiple(result.errors));
      }
      throw new Error('Parse failed');
    }

    const outputData = this.formatResult(result);
    const outputContent = options.format === 'yaml'
      ? OutputFormatter.toYAML(outputData)
      : OutputFormatter.toJSON(outputData);

    OutputFormatter.output(outputContent, options.output);
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

  private formatResult(result: any): any {
    return {
      metadata: {
        standard: result.metadata.standard.toString(),
        version: result.message?.version?.toString(),
        messageType: result.message?.messageType?.toString(),
        segmentCount: result.metadata.segmentCount,
        delimiters: {
          segment: result.metadata.delimiters.segment,
          element: result.metadata.delimiters.element,
          component: result.metadata.delimiters.component,
        },
      },
      segments: result.message?.segments.map((seg: any) => ({
        tag: seg.tag,
        elements: seg.elements.map((el: any) => ({
          value: el.value,
          components: el.components.length > 0 ? el.components : undefined,
        })),
      })),
    };
  }
}
