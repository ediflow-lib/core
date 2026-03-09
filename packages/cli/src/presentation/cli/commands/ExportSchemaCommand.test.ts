import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExportSchemaCommand } from './ExportSchemaCommand';
import {IMessageStructureRepository, MessageStructureDTO, SchemaGenerationService, JSONSchema} from "@ediflow/core";


describe('ExportSchemaCommand', () => {
  let command: ExportSchemaCommand;
  let mockGenerator: SchemaGenerationService;
  let mockRepository: IMessageStructureRepository;

  const mockMessageStructure: MessageStructureDTO = {
    standard: 'EDIFACT',
    version: 'D.20B',
    messageType: 'DESADV',
    name: 'Despatch Advice',
    structure: []
  };

  const mockSchema: JSONSchema = {
    type: 'object',
    properties: {
      documentNumber: { type: 'string' }
    }
  };

  beforeEach(() => {
    mockGenerator = {
      fromMessageStructure: vi.fn().mockReturnValue(mockSchema)
    } as any;

    mockRepository = {
      getMessageStructure: vi.fn().mockResolvedValue(mockMessageStructure)
    } as any;

    command = new ExportSchemaCommand(mockGenerator, mockRepository);
  });

  describe('execute', () => {
    it('should export schema for single message in JSON format', async () => {
      const messageType = 'DESADV';
      const version = 'D.20B';

      const result = await command.execute({
        message: messageType,
        version,
        format: 'json'
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should export schema in YML format', async () => {
      const messageType = 'DESADV';

      const result = await command.execute({
        message: messageType,
        format: 'yml'
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('type:');
    });

    it('should use default version D.20B when not specified', async () => {
      const messageType = 'ORDERS';

      const result = await command.execute({
        message: messageType
      });

      expect(result).toBeDefined();
    });

    it('should use default JSON format when not specified', async () => {
      const messageType = 'INVOIC';

      const result = await command.execute({
        message: messageType
      });

      expect(result).toBeDefined();
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should throw error when message is not provided', async () => {
      await expect(command.execute({})).rejects.toThrow('Message type is required');
    });
  });

  describe('exportAll', () => {
    it('should export all message types', async () => {
      const allMessageTypes = ['DESADV', 'ORDERS', 'INVOIC'];
      mockRepository.getAllMessageTypes = vi.fn().mockResolvedValue(allMessageTypes);

      const results = await command.exportAll('D.20B', 'json');

      expect(results).toHaveLength(3);
      expect(results[0]).toHaveProperty('messageType');
      expect(results[0]).toHaveProperty('schema');
    });

    it('should handle empty message type list', async () => {
      mockRepository.getAllMessageTypes = vi.fn().mockResolvedValue([]);

      const results = await command.exportAll('D.20B', 'json');

      expect(results).toHaveLength(0);
    });
  });

  describe('formatSchema', () => {
    it('should format schema as pretty-printed JSON', () => {
      const formatted = (command as any).formatSchema(mockSchema, 'json');

      expect(formatted).toContain('"type": "object"');
      expect(formatted).toContain('\n');
    });

    it('should format schema as YML', () => {
      const formatted = (command as any).formatSchema(mockSchema, 'yml');

      expect(formatted).toContain('type: object');
      expect(formatted).toContain('properties:');
    });
  });

  describe('Error Handling', () => {
    it('should propagate repository errors', async () => {
      mockRepository.getMessageStructure = vi.fn().mockRejectedValue(
        new Error('Message type not found')
      );

      await expect(command.execute({message: 'INVALID'})).rejects.toThrow('Message type not found');
    });
  });
});
