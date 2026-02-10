
import type { IMessageStructureRepository, SchemaGenerationService } from '@ediflow/core';
import * as yaml from 'js-yaml';


export interface ExportSchemaOptions {
  message?: string;
  version?: string;
  format?: 'json' | 'yml';
  output?: string;
  all?: boolean;
}

export class ExportSchemaCommand {
  constructor(
    private readonly generator: SchemaGenerationService,
    private readonly repository: IMessageStructureRepository
  ) {}

  async execute(options: ExportSchemaOptions): Promise<string> {
    const version = options.version || 'D.20B';
    const format = options.format || 'json';

    if (!options.message) {
      throw new Error('Message type is required');
    }

    const structure = await this.repository.getMessageDefinition(
      'EDIFACT',
      version,
      options.message
    );

    if (!structure) {
      throw new Error(`Message type ${options.message} not found`);
    }

    const schema = this.generator.fromMessageStructure(structure);

    return this.formatSchema(schema, format);
  }

  async exportAll(version: string, format: 'json' | 'yml'): Promise<Array<{ messageType: string; schema: string }>> {
    const messageTypes = await this.repository.getAllMessageTypes('EDIFACT', version);
    const results: Array<{ messageType: string; schema: string }> = [];

    for (const messageType of messageTypes) {
      const structure = await this.repository.getMessageDefinition('EDIFACT', version, messageType);

      if (!structure) continue;

      const schema = this.generator.fromMessageStructure(structure);
      const formatted = this.formatSchema(schema, format);

      results.push({
        messageType,
        schema: formatted
      });
    }

    return results;
  }

  private formatSchema(schema: any, format: 'json' | 'yml'): string {
    if (format === 'yml') {
      return yaml.dump(schema, { indent: 2 });
    }
    return JSON.stringify(schema, null, 2);
  }
}
