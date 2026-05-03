import * as fs from 'fs/promises';
import * as path from 'path';
import type { IMessageStructureRepository, MessageStructureDTO } from '@ediflow/core';
import { MessageStructureBuilder } from './MessageStructureBuilder';
import { DataPackageValidator } from './DataPackageValidator';
import { DataPackageValidationError } from './DataPackageValidationError';
import {
  MessageFileSchema,
  SegmentsFileSchema,
  ElementsFileSchema,
  CompositesFileSchema,
  SyntaxRulesFileSchema,
  CodeListSchema
} from './models/DataPackageModels';
import type {
  MessageFile,
  SegmentDefinition,
  ElementDefinition,
  CompositeDefinition,
  SyntaxRule
} from './models/DataPackageModels';
import type { ZodSchema } from 'zod';

interface DataPackageContext {
  builder: MessageStructureBuilder;
  validator: DataPackageValidator;
}

export class FileBasedMessageStructureRepository implements IMessageStructureRepository {
  private contextCache = new Map<string, DataPackageContext>();

  // Non-standard package names that don't follow {standard}-{version} pattern
  private static readonly PACKAGE_ALIASES = new Map<string, string>([
    ['x12:005010', 'hipaa-x12-005010'],
    ['edifact:eancom2002', 'eancom-2002'],
  ]);

  constructor(private readonly basePath: string) {}

  async getMessageStructure(
    standard: string,
    version: string,
    messageType: string
  ): Promise<MessageStructureDTO | null> {
    const messageFile = await this.loadMessageFile(standard, version, messageType);
    if (!messageFile) {
      return null;
    }

    const { builder, validator } = await this.getOrCreateContext(standard, version);

    const issues = validator.validate(messageFile);
    if (issues.length > 0) {
      throw new DataPackageValidationError(standard, version, messageType, issues);
    }

    return builder.build(messageFile);
  }

  async getAllMessageTypes(standard: string, version: string): Promise<string[]> {
    try {
      const dirPath = this.getMessageDirPath(standard, version);
      const files = await fs.readdir(dirPath);

      return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.basename(file, path.extname(file)));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async hasMessageStructure(
    standard: string,
    version: string,
    messageType: string
  ): Promise<boolean> {
    try {
      const filePath = this.getMessageFilePath(standard, version, messageType);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getCodeList(standard: string, version: string, codeListCode: string): Promise<Set<string> | null> {
    try {
      const filePath = path.join(
        this.getDataDirPath(standard, version),
        'codes',
        `${codeListCode}.json`
      );
      const content = await fs.readFile(filePath, 'utf-8');
      const codeList = CodeListSchema.parse(JSON.parse(content));
      return new Set(codeList.values.map(v => v.code));
    } catch {
      return null;
    }
  }

  private async loadMessageFile(
    standard: string,
    version: string,
    messageType: string
  ): Promise<MessageFile | null> {
    try {
      const filePath = this.getMessageFilePath(standard, version, messageType);
      const content = await fs.readFile(filePath, 'utf-8');
      return MessageFileSchema.parse(JSON.parse(content));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  private async getOrCreateContext(standard: string, version: string): Promise<DataPackageContext> {
    const cacheKey = `${standard.toLowerCase()}:${version.toLowerCase()}`;
    const cached = this.contextCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const dataDir = this.getDataDirPath(standard, version);
    const [segments, elements, composites, syntaxRules] = await Promise.all([
      this.loadJsonFile<Record<string, SegmentDefinition>>(path.join(dataDir, 'segments.json'), SegmentsFileSchema),
      this.loadJsonFile<Record<string, ElementDefinition>>(path.join(dataDir, 'elements.json'), ElementsFileSchema),
      this.loadJsonFile<Record<string, CompositeDefinition>>(path.join(dataDir, 'composites.json'), CompositesFileSchema),
      this.loadOptionalJsonFile<Record<string, SyntaxRule[]>>(path.join(dataDir, 'segment-syntax-rules.json'), SyntaxRulesFileSchema)
    ]);

    const context: DataPackageContext = {
      builder: new MessageStructureBuilder(segments, elements, composites, syntaxRules),
      validator: new DataPackageValidator(segments, elements, composites)
    };

    this.contextCache.set(cacheKey, context);
    return context;
  }

  private async loadJsonFile<T>(filePath: string, schema: ZodSchema<T>): Promise<T> {
    const content = await fs.readFile(filePath, 'utf-8');
    return schema.parse(JSON.parse(content));
  }

  private async loadOptionalJsonFile<T>(filePath: string, schema: ZodSchema<T>): Promise<T | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return schema.parse(JSON.parse(content));
    } catch {
      return null;
    }
  }

  private getDataDirPath(standard: string, version: string): string {
    const aliasKey = `${standard.toLowerCase()}:${version.toLowerCase().replace(/\./g, '')}`;
    const alias = FileBasedMessageStructureRepository.PACKAGE_ALIASES.get(aliasKey);

    if (alias) {
      return path.join(this.basePath, alias, 'data');
    }

    const normalizedVersion = version.toLowerCase().replace(/\./g, '');
    return path.join(
      this.basePath,
      `${standard.toLowerCase()}-${normalizedVersion}`,
      'data'
    );
  }

  private getMessageDirPath(standard: string, version: string): string {
    return path.join(this.getDataDirPath(standard, version), 'messages');
  }

  private getMessageFilePath(
    standard: string,
    version: string,
    messageType: string
  ): string {
    return path.join(
      this.getMessageDirPath(standard, version),
      `${messageType.toUpperCase()}.json`
    );
  }
}
