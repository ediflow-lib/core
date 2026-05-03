import type { Command } from 'commander';
import type { IMessageStructureRepository, JSONSchema, SchemaGenerationService } from '@ediflow/core';
import * as yaml from 'js-yaml';

export interface ExportSchemaOptions {
  message?: string;
  version?: string;
  standard?: string;
  format?: 'json' | 'yml';
  output?: string;
  all?: boolean;
}

export class ExportSchemaCommand {
  constructor(
    private readonly generator: SchemaGenerationService,
    private readonly repository: IMessageStructureRepository
  ) {}

  register(program: Command): void {
    program
      .command('export-schema')
      .description('Export EDI message schema as JSON Schema (Draft-07) — compatible with OpenAPI components/schemas and Zod')
      .option('-m, --message <type>', 'Message type (e.g. 850, ORDERS)')
      .option('-s, --standard <standard>', 'EDI standard (EDIFACT, X12)', 'EDIFACT')
      .option('-v, --version <version>', 'Standard version (e.g. 004010, D.20B)', 'D.20B')
      .option('-f, --format <format>', 'Output format: json | yml', 'json')
      .option('--all', 'Export all message types for this standard/version')
      .action(async (options: ExportSchemaOptions) => {
        if (options.all) {
          const results = await this.exportAll(
            options.standard ?? 'EDIFACT',
            options.version ?? 'D.20B',
            options.format ?? 'json'
          );
          process.stdout.write(JSON.stringify(results, null, 2) + '\n');
        } else {
          const result = await this.execute(options);
          process.stdout.write(result + '\n');
        }
      });
  }

  async execute(options: ExportSchemaOptions): Promise<string> {
    const standard = options.standard ?? 'EDIFACT';
    const version = options.version ?? 'D.20B';
    const format = options.format ?? 'json';

    if (!options.message) {
      throw new Error('Message type is required');
    }

    const structure = await this.repository.getMessageStructure(standard, version, options.message);

    if (!structure) {
      throw new Error(`Message type ${options.message} not found`);
    }

    const schema = this.generator.fromMessageStructure(structure);

    return this.formatSchema(schema, format);
  }

  async exportAll(
    standard: string,
    version: string,
    format: 'json' | 'yml'
  ): Promise<Array<{ messageType: string; schema: string }>> {
    const messageTypes = await this.repository.getAllMessageTypes(standard, version);
    const results: Array<{ messageType: string; schema: string }> = [];

    for (const messageType of messageTypes) {
      const structure = await this.repository.getMessageStructure(standard, version, messageType);

      if (!structure) continue;

      const schema = this.generator.fromMessageStructure(structure);

      results.push({
        messageType,
        schema: this.formatSchema(schema, format)
      });
    }

    return results;
  }

  private formatSchema(schema: JSONSchema, format: 'json' | 'yml'): string {
    if (format === 'yml') {
      return yaml.dump(schema, { indent: 2 });
    }
    return JSON.stringify(schema, null, 2);
  }
}
