import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExportSchemaCommand } from '@presentation/cli/commands/ExportSchemaCommand';
import { BusinessObjectSchemaGenerator } from '@domain/validation/BusinessObjectSchemaGenerator';
import { SchemaCache } from '@domain/validation/SchemaCache';
import type { IMessageStructureRepository } from '@domain/repositories/IMessageStructureRepository';
import type { MessageStructure, SegmentNode, ElementNode } from '@domain/repositories/MessageStructure';

describe('Integration: ExportSchemaCommand (US-7.9)', () => {
  let command: ExportSchemaCommand;
  let mockRepository: IMessageStructureRepository;

  const desadvStructure: MessageStructure = {
    standard: 'EDIFACT',
    version: 'D.20B',
    messageType: 'DESADV',
    name: 'Despatch Advice',
    structure: [
      {
        nodeType: 'segment',
        tag: 'BGM',
        name: 'Beginning of message',
        mandatory: true,
        maxOccurrences: 1,
        position: 10,
        elements: [
          {
            nodeType: 'element',
            code: '1001',
            name: 'documentNumber',
            mandatory: true,
            position: 1,
            dataType: 'an',
            maxLength: 35
          } as ElementNode
        ],
        mapping: {
          targetField: 'documentNumber',
          elementIndex: 0
        }
      } as SegmentNode
    ]
  };

  beforeEach(() => {
    const cache = new SchemaCache();
    const generator = new BusinessObjectSchemaGenerator(cache);

    mockRepository = {
      getMessageDefinition: vi.fn().mockImplementation((_standard, _version, msgType: string) => {
        if (msgType === 'DESADV' || msgType === 'ORDERS' || msgType === 'INVOIC') {
          return Promise.resolve({ ...desadvStructure, messageType: msgType });
        }
        return Promise.resolve(null);
      }),
      getAllMessageTypes: vi.fn().mockResolvedValue(['DESADV', 'ORDERS', 'INVOIC']),
      hasMessageDefinition: vi.fn().mockResolvedValue(true)
    };

    command = new ExportSchemaCommand(generator, mockRepository);
  });

  describe('Single Message Export', () => {
    it('should export DESADV schema as JSON', async () => {
      const result = await command.execute({
        message: 'DESADV',
        version: 'D.20B',
        format: 'json'
      });

      expect(result).toBeDefined();
      const schema = JSON.parse(result);

      expect(schema.type).toBe('object');
      expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(schema.properties).toBeDefined();
    });

    it('should export ORDERS schema as YML', async () => {
      const result = await command.execute({
        message: 'ORDERS',
        version: 'D.96A',
        format: 'yml'
      });

      expect(result).toBeDefined();
      expect(result).toContain('type: object');
      expect(result).toContain('properties:');
    });

    it('should use default values when not specified', async () => {
      const result = await command.execute({
        message: 'INVOIC'
      });

      expect(result).toBeDefined();
      const schema = JSON.parse(result);
      expect(schema.type).toBe('object');
    });
  });

  describe('Batch Export', () => {
    it('should export all available message types', async () => {
      const results = await command.exportAll('D.96A', 'json');

      expect(results.length).toBeGreaterThan(0);

      for (const result of results) {
        expect(result.messageType).toBeDefined();
        expect(result.schema).toBeDefined();
        expect(() => JSON.parse(result.schema)).not.toThrow();
      }
    });

    it('should export all message types in YML format', async () => {
      const results = await command.exportAll('D.96A', 'yml');

      expect(results.length).toBeGreaterThan(0);

      for (const result of results) {
        expect(result.schema).toContain('type:');
        expect(result.schema).toContain('properties:');
      }
    });
  });

  describe('Error Cases', () => {
    it('should throw error for non-existent message type', async () => {
      expect(
          command.execute({
            message: 'NONEXISTENT',
            version: 'D.20B'
          })
      ).rejects.toThrow('Message type NONEXISTENT not found');
    });
  });

  describe('Schema Content Validation', () => {
    it('should include message-specific properties in schema', async () => {
      const result = await command.execute({
        message: 'DESADV',
        version: 'D.20B'
      });

      const schema = JSON.parse(result);

      expect(schema.title).toBeDefined();
      expect(schema.properties).toBeDefined();
      expect(Object.keys(schema.properties).length).toBeGreaterThan(0);
    });
  });
});
