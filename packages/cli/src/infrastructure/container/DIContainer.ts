import { fileURLToPath } from 'url';
import { dirname, join, sep } from 'path';
import { UseCaseFactory, EDIMessageValidationService, SchemaGenerationService, SchemaCache, StructureMappingService } from '@ediflow/core';
import {
  EdifactMessageParser,
  EdifactDelimiterDetector,
  EdifactTokenizer,
  EdifactSegmentParser,
  EdifactMessageBuilder
} from '@ediflow/edifact';
import {
  X12MessageParser,
  X12DelimiterDetector,
  X12SegmentParser,
  X12EnvelopeParser,
} from '@ediflow/x12';
import { FileBasedMessageStructureRepository } from '@ediflow/infrastructure-shared';
import { ExportSchemaCommand } from '@presentation/cli/commands/ExportSchemaCommand';
import type { IMessageStructureRepository } from '@ediflow/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// packages/ directory — contains edifact-d20b/, x12-004010/, x12-006040/ etc.
// In dist/: __dirname = packages/cli/dist/           → 2 levels up = packages/
// In src/:  __dirname = packages/cli/src/infrastructure/container/ → 4 levels up = packages/
const isDistBuild = __dirname.includes(`${sep}dist`);
const DATA_PACKAGES_BASE_PATH = isDistBuild
  ? join(__dirname, '../../')
  : join(__dirname, '../../../../');

export class DIContainer {
  private static instance: DIContainer;
  public readonly useCaseFactory: UseCaseFactory;
  public readonly exportSchemaCommand: ExportSchemaCommand;
  public readonly repository: IMessageStructureRepository;
  public readonly structureMappingService: StructureMappingService;

  private constructor() {
    const edifactDelimiterDetector = new EdifactDelimiterDetector();
    const edifactTokenizer = new EdifactTokenizer();
    const edifactSegmentParser = new EdifactSegmentParser();
    const edifactParser = new EdifactMessageParser(
      edifactDelimiterDetector,
      edifactTokenizer,
      edifactSegmentParser
    );
    const edifactMessageBuilder = new EdifactMessageBuilder();

    const parsers = new Map();
    parsers.set('EDIFACT', edifactParser);

    const x12Parser = new X12MessageParser(
      new X12DelimiterDetector(),
      new X12SegmentParser(),
      new X12EnvelopeParser()
    );
    parsers.set('X12', x12Parser);

    const builders = new Map();
    builders.set('EDIFACT', edifactMessageBuilder);

    const validationService = new EDIMessageValidationService();
    this.useCaseFactory = new UseCaseFactory(parsers, builders, validationService);

    this.repository = new FileBasedMessageStructureRepository(DATA_PACKAGES_BASE_PATH);
    this.structureMappingService = new StructureMappingService();

    const schemaGenerator = new SchemaGenerationService(new SchemaCache());
    this.exportSchemaCommand = new ExportSchemaCommand(schemaGenerator, this.repository);
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  getUseCaseFactory(): UseCaseFactory {
    return this.useCaseFactory;
  }
}