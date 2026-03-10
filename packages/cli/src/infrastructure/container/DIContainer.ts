import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { UseCaseFactory, EDIMessageValidationService, SchemaGenerationService, SchemaCache } from '@ediflow/core';
import {
  EdifactMessageParser,
  EdifactDelimiterDetector,
  EdifactTokenizer,
  EdifactSegmentParser,
  EdifactMessageBuilder
} from '@ediflow/edifact';
import { FileBasedMessageStructureRepository } from '@ediflow/infrastructure-shared';
import { ExportSchemaCommand } from '@presentation/cli/commands/ExportSchemaCommand';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// packages/ directory — contains edifact-d20b/, x12-004010/, x12-006040/ etc.
const DATA_PACKAGES_BASE_PATH = join(__dirname, '../../../../..');

export class DIContainer {
  private static instance: DIContainer;
  public readonly useCaseFactory: UseCaseFactory;
  public readonly exportSchemaCommand: ExportSchemaCommand;

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

    const builders = new Map();
    builders.set('EDIFACT', edifactMessageBuilder);

    const validationService = new EDIMessageValidationService();
    this.useCaseFactory = new UseCaseFactory(parsers, builders, validationService);

    const repository = new FileBasedMessageStructureRepository(DATA_PACKAGES_BASE_PATH);
    const schemaGenerator = new SchemaGenerationService(new SchemaCache());
    this.exportSchemaCommand = new ExportSchemaCommand(schemaGenerator, repository);
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
