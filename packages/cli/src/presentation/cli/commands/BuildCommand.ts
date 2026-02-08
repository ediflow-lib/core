import { Command } from 'commander';
import { UseCaseFactory } from '@ediflow/core';
import { Standard } from '@ediflow/core';
import { EDIMessage, EDISegment, EDIElement } from '@ediflow/core';
import { Version } from '@ediflow/core';
import { MessageType } from '@ediflow/core';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';
import { ErrorHandler } from '../utils';

export class BuildCommand {
  constructor(
    private readonly useCaseFactory: UseCaseFactory
  ) {}

  register(program: Command): void {
    program
      .command('build')
      .description('Build an EDI message from JSON')
      .argument('<file>', 'JSON file path with EDI message structure')
      .option('-s, --standard <standard>', 'EDI standard (EDIFACT, X12)', undefined)
      .option('-o, --output <file>', 'Output file path', undefined)
      .action(async (file: string, options) => {
        try {
          const result = await this.execute(file, options);
          if (options.output) {
            writeFileSync(options.output, result);
            console.log(`EDI message saved to: ${options.output}`);
          } else {
            console.log(result);
          }
          process.exit(0);
        } catch (error) {
          console.error(ErrorHandler.format(error as Error));
          process.exit(1);
        }
      });
  }

  async execute(file: string, options: any): Promise<string> {
    const jsonContent = this.readJSON(file);
    const jsonData = JSON.parse(jsonContent);
    const message = this.parseJSON(jsonData);

    const standardStr = options.standard || jsonData.standard;
    const buildUseCase = this.useCaseFactory.createBuildUseCase(standardStr);

    const result = buildUseCase.execute({ message });

    if (!result.success) {
      throw new Error(ErrorHandler.formatMultiple(result.errors));
    }

    return result.ediString;
  }

  private readJSON(filePath: string): string {
    try {
      return readFileSync(filePath, 'utf-8');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('ENOENT')) {
          throw new Error(`File not found: ${filePath}`);
        }
        throw new Error(`Failed to read file: ${error.message}`);
      }
      throw error;
    }
  }

  private parseJSON(json: any): EDIMessage {
    if (!json.standard) {
      throw new Error('Missing required field: standard');
    }

    if (!json.segments || !Array.isArray(json.segments)) {
      throw new Error('Invalid JSON structure: segments must be an array');
    }

    const standard = this.parseStandard(json.standard);
    const version = this.resolveVersion(standard, json.version);
    const messageType = this.resolveMessageType(standard, json.messageType);

    const message = new EDIMessage(standard, version, messageType);

    for (const segmentData of json.segments) {
      const segment = this.parseSegment(segmentData);
      message.addSegment(segment);
    }

    return message;
  }

  private resolveVersion(standard: Standard, versionStr?: string): Version {
    if (versionStr) {
      return new Version(standard, versionStr);
    }

    const defaultVersion = standard === Standard.EDIFACT ? 'D.96A' : '004010';
    return new Version(standard, defaultVersion);
  }

  private resolveMessageType(standard: Standard, messageTypeStr?: string): MessageType {
    if (messageTypeStr) {
      return new MessageType(standard, messageTypeStr);
    }

    const defaultMessageType = standard === Standard.EDIFACT ? 'ORDERS' : '850';
    return new MessageType(standard, defaultMessageType);
  }

  private parseSegment(segmentData: any): EDISegment {
    if (!segmentData.tag) {
      throw new Error('Segment must have a tag');
    }

    const elements = segmentData.elements?.map((elem: any) => this.parseElement(elem)) || [];

    return new EDISegment(segmentData.tag, elements);
  }

  private parseElement(elementData: any): EDIElement {
    const value = elementData.value || '';
    const components = elementData.components || [];

    return new EDIElement(value, components);
  }

  private parseStandard(standardStr: string): Standard {
    const upper = standardStr.toUpperCase();
    if (upper === 'EDIFACT') return Standard.EDIFACT;
    if (upper === 'X12') return Standard.X12;
    throw new Error(`Unsupported standard: ${standardStr}`);
  }
}
