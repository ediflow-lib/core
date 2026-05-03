import { Command } from 'commander';
import { UseCaseFactory, StructureMappingService } from '@ediflow/core';
import { Standard } from '@ediflow/core';
import { ParserConfig, DEFAULT_PARSER_CONFIG } from '@ediflow/core';
import type { IMessageStructureRepository } from '@ediflow/core';
import type { MappingKeyStrategy } from '@ediflow/core';
import { readEDIFile, OutputFormatter, ErrorHandler } from '../utils';

const VALID_OUTPUT_TYPES = ['edi-message', 'business-object'] as const;
type OutputType = typeof VALID_OUTPUT_TYPES[number];

const VALID_PROPERTY_MODES = ['code', 'name', 'camelCase', 'snake_case', 'kebab-case'] as const;

/**
 * Parse Command
 *
 * --output-type edi-message      Raw segments/elements (default, no data package needed)
 * --output-type business-object  Structure-mapped object keyed by strategy (needs data package)
 *
 * --property-parse-mode code        { "BGM": { "1004": "PO-001" } }         (default)
 * --property-parse-mode name        { "Beginning of message": { "Document identifier": "PO-001" } }
 * --property-parse-mode camelCase   { "beginningOfMessage": { "documentIdentifier": "PO-001" } }
 * --property-parse-mode snake_case  { "beginning_of_message": { "document_identifier": "PO-001" } }
 * --property-parse-mode kebab-case  { "beginning-of-message": { "document-identifier": "PO-001" } }
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
      .option(
        '--output-type <type>',
        `Output type: ${VALID_OUTPUT_TYPES.join(' | ')} (default: edi-message)`,
        'edi-message'
      )
      .option(
        '--property-parse-mode <mode>',
        `Key naming for business-object output: ${VALID_PROPERTY_MODES.join(' | ')} (default: code)`,
        'code'
      )
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
      propertyParseMode: DEFAULT_PARSER_CONFIG.propertyParseMode,
      codeListValueParseMode: DEFAULT_PARSER_CONFIG.codeListValueParseMode,
    };

    const outputType: OutputType = VALID_OUTPUT_TYPES.includes(options.outputType)
      ? options.outputType as OutputType
      : 'edi-message';

    const mappingKeyStrategy: MappingKeyStrategy = VALID_PROPERTY_MODES.includes(options.propertyParseMode)
      ? options.propertyParseMode as MappingKeyStrategy
      : 'code';

    // Phase 1: parse EDI string â†’ EDIMessage
    const rawUseCase = this.useCaseFactory.createParseUseCase(standardStr);
    const rawResult = rawUseCase.execute({ message: content, standard: standardEnum, parserConfig });

    if (!rawResult.success) {
      throw new Error(rawResult.errors?.length
        ? ErrorHandler.formatMultiple(rawResult.errors)
        : 'Parse failed'
      );
    }

    // â”€â”€ edi-message â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (outputType === 'edi-message') {
      this.writeOutput(this.formatEDIMessageResult(rawResult), options);
      return;
    }

    // â”€â”€ business-object â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const structure = this.repository
      ? await this.repository.getMessageStructure(
          standardStr.toUpperCase(),
          rawResult.metadata.version.value,
          rawResult.metadata.messageType.value
        )
      : null;

    if (!structure || !this.structureMappingService) {
      const warning = `No structure definition found for ${standardStr} ${rawResult.metadata.version?.value} ${rawResult.metadata.messageType?.value}. Install the corresponding data package.`;
      this.writeOutput({ _warning: warning, ...this.formatEDIMessageResult(rawResult) }, options);
      return;
    }

    const mappedUseCase = this.useCaseFactory.createParseUseCase(standardStr, this.structureMappingService);
    const mappedResult = mappedUseCase.execute({
      message: content,
      standard: standardEnum,
      parserConfig,
      returnTypedObject: true,
      messageStructure: structure,
      mappingKeyStrategy,
    });

    const outputData = mappedResult.success && mappedResult.businessObject
      ? mappedResult.businessObject
      : { _warning: 'Mapping failed. Falling back to raw EDI message.', ...this.formatEDIMessageResult(rawResult) };

    this.writeOutput(outputData, options);
  }

  private writeOutput(data: unknown, options: any): void {
    const content = options.format === 'yaml'
      ? OutputFormatter.toYAML(data)
      : OutputFormatter.toJSON(data);
    OutputFormatter.output(content, options.output);
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
    if (content.startsWith('UNB') || content.startsWith('UNA')) return 'EDIFACT';
    if (content.startsWith('ISA')) return 'X12';
    throw new Error('Unable to detect EDI standard. Please specify with --standard flag.');
  }

  private parseStandard(standardStr: string): Standard {
    const upper = standardStr.toUpperCase();
    if (upper === 'EDIFACT') return Standard.EDIFACT;
    if (upper === 'X12') return Standard.X12;
    throw new Error(`Unsupported standard: ${standardStr}`);
  }
}


/**
 * Parse Command - CLI handler for parsing EDI files.
 *
 * Smart output strategy:
 * - If structure package found â†’ returns Business Object under "data" key
 * - If no structure package â†’ returns raw segments with "_warning" key
 */
