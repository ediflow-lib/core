import { Command } from 'commander';
import { UseCaseFactory, StructureMappingService } from '@ediflow/core';
import { Standard } from '@ediflow/core';
import { ParserConfig, DEFAULT_PARSER_CONFIG } from '@ediflow/core';
import type { IMessageStructureRepository } from '@ediflow/core';
import { readEDIFile, OutputFormatter, ErrorHandler } from '../utils';

/**
 * Parse Command - CLI handler for parsing EDI files.
 *
 * Smart output strategy:
 * - If structure package found → returns Business Object under "data" key
 * - If no structure package → returns raw segments with "_warning" key
 */
export class ParseCommand {
  constructor(
    private readonly useCaseFactory: UseCaseFactory,
    private readonly repository?: IMessageStructureRepository,
    private readonly structureMappingService?: StructureMappingService
  ) {}

  register(program: Command): void {
    program
      .command('parse')
      .description('Parse an EDI file')
      .argument('<file>', 'EDI file path')
      .option('-s, --standard <standard>', 'EDI standard (EDIFACT, X12)', undefined)
      .option('-f, --format <format>', 'Output format (json, yaml)', 'json')
      .option('-o, --output <file>', 'Output file path', undefined)
      .option('--output-type <type>', 'Output type: edi-message (default), business-object, structure', 'edi-message')
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

  async execute(file: string, options: any): Promise<void> {
    const content = readEDIFile(file);
    const standardStr = options.standard || this.detectStandard(content);
    const standardEnum = this.parseStandard(standardStr);

    const parserConfig: ParserConfig = {
      propertyParseMode: options.propertyParseMode || DEFAULT_PARSER_CONFIG.propertyParseMode,
      codeListValueParseMode: options.codelistValueParseMode || DEFAULT_PARSER_CONFIG.codeListValueParseMode,
    };

    // Phase 1: Syntax parse to get version + messageType
    const rawUseCase = this.useCaseFactory.createParseUseCase(standardStr);
    const rawResult = rawUseCase.execute({ message: content, standard: standardEnum, parserConfig });

    if (!rawResult.success) {
      if (rawResult.errors && rawResult.errors.length > 0) {
        throw new Error(ErrorHandler.formatMultiple(rawResult.errors));
      }
      throw new Error('Parse failed');
    }

    const outputType: string = options.outputType || 'edi-message';

    // Default output: EDIMessage as JSON (no structure package needed)
    if (outputType === 'edi-message') {
      const outputData = this.formatEDIMessageResult(rawResult);
      const outputContent = options.format === 'yaml'
        ? OutputFormatter.toYAML(outputData)
        : OutputFormatter.toJSON(outputData);
      OutputFormatter.output(outputContent, options.output);
      return;
    }

    // Business Object or Structure output: requires structure package
    const structure = this.repository
      ? await this.repository.getMessageStructure(
          standardStr.toUpperCase(),
          rawResult.metadata.version.value,
          rawResult.metadata.messageType.value
        )
      : null;

    let outputData: any;

    if (outputType === 'structure') {
      if (structure) {
        outputData = structure;
      } else {
        outputData = { _warning: `No structure definition found for ${standardStr} ${rawResult.metadata.version?.value} ${rawResult.metadata.messageType?.value}. Install the corresponding data package.` };
      }
    } else if (outputType === 'business-object') {
      if (structure && this.structureMappingService) {
        const mapper = this.structureMappingService;
        const mappedUseCase = this.useCaseFactory.createParseUseCase(standardStr, mapper);
        const mappedResult = mappedUseCase.execute({
          message: content,
          standard: standardEnum,
          parserConfig,
          returnTypedObject: true,
          messageStructure: structure,
        });

        if (mappedResult.success) {
          outputData = mappedResult.businessObject;
        } else {
          outputData = { _warning: 'Mapping failed. Falling back to raw EDI message.', ...this.formatEDIMessageResult(rawResult) };
        }
      } else {
        outputData = { _warning: `No structure definition found for ${standardStr} ${rawResult.metadata.version?.value} ${rawResult.metadata.messageType?.value}. Install the corresponding data package.`, ...this.formatEDIMessageResult(rawResult) };
      }
    } else {
      outputData = this.formatEDIMessageResult(rawResult);
    }

    const outputContent = options.format === 'yaml'
      ? OutputFormatter.toYAML(outputData)
      : OutputFormatter.toJSON(outputData);

    OutputFormatter.output(outputContent, options.output);
  }

  private formatEDIMessageResult(result: any): any {
    return {
      standard: result.metadata.standard.toString(),
      version: result.metadata.version?.toString(),
      messageType: result.metadata.messageType?.toString(),
      segmentCount: result.metadata.segmentCount,
      delimiters: result.metadata.delimiters
        ? {
            segment: result.metadata.delimiters.segment,
            element: result.metadata.delimiters.element,
            component: result.metadata.delimiters.component,
          }
        : undefined,
      segments: result.message?.segments.map((seg: any) => ({
        tag: seg.tag,
        elements: seg.elements.map((el: any) => ({
          value: el.value,
          ...(el.components && el.components.length > 0 ? { components: el.components } : {}),
        })),
      })),
    };
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
