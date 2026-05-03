import { fileURLToPath } from 'url';
import { dirname, join, sep } from 'path';
import { existsSync } from 'fs';
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

// Resolve packages/ directory by walking up until edifact-d96a is found.
// This works regardless of whether __dirname is dist/ or src/infrastructure/container/.
function resolvePackagesRoot(startDir: string): string {
  let current = startDir;
  for (let i = 0; i <= 5; i++) {
    if (existsSync(join(current, 'edifact-d96a'))) {
      return join(current, sep);  // normalize with trailing separator
    }
    current = dirname(current);
  }
  // Fallback
  const isInDist = startDir.endsWith(`${sep}dist`) || startDir.includes(`${sep}dist${sep}`);
  return isInDist ? join(startDir, '../../') : join(startDir, '../../../../');
}

const DATA_PACKAGES_BASE_PATH = resolvePackagesRoot(__dirname);

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