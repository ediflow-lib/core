import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExportSchemaCommand } from './ExportSchemaCommand';
import { IMessageStructureRepository, MessageStructureDTO, SchemaGenerationService, JSONSchema } from '@ediflow/core';

const createMockStructure = (standard: string, version: string, messageType: string, name: string): MessageStructureDTO => ({
  standard,
  version,
  messageType,
  name,
  structure: []
});

const mockSchema: JSONSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    ST: { type: 'object' }
  },
  required: ['ST'],
  additionalProperties: false
};

describe('ExportSchemaCommand', () => {
  let command: ExportSchemaCommand;
  let mockGenerator: SchemaGenerationService;
  let mockRepository: IMessageStructureRepository;

  beforeEach(() => {
    mockGenerator = {
      fromMessageStructure: vi.fn().mockReturnValue(mockSchema)
    } as unknown as SchemaGenerationService;

    mockRepository = {
      getMessageStructure: vi.fn().mockResolvedValue(
        createMockStructure('EDIFACT', 'D.20B', 'DESADV', 'Despatch Advice')
      ),
      getAllMessageTypes: vi.fn().mockResolvedValue([]),
    } as unknown as IMessageStructureRepository;

    command = new ExportSchemaCommand(mockGenerator, mockRepository);
  });

  describe('EDIFACT — existing behaviour', () => {
    it('should export EDIFACT schema in JSON format', async () => {
      const result = await command.execute({ message: 'DESADV', version: 'D.20B', format: 'json' });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should export EDIFACT schema in YML format', async () => {
      const result = await command.execute({ message: 'DESADV', format: 'yml' });

      expect(result).toContain('type:');
    });

    it('should use EDIFACT as default standard when --standard is omitted', async () => {
      await command.execute({ message: 'ORDERS' });

      expect(mockRepository.getMessageStructure).toHaveBeenCalledWith('EDIFACT', expect.any(String), 'ORDERS');
    });

    it('should use D.20B as default version when --version is omitted', async () => {
      await command.execute({ message: 'INVOIC' });

      expect(mockRepository.getMessageStructure).toHaveBeenCalledWith(expect.any(String), 'D.20B', 'INVOIC');
    });

    it('should throw when --message is not provided', async () => {
      await expect(command.execute({})).rejects.toThrow('Message type is required');
    });
  });

  describe('X12 — Happy Cases', () => {
    beforeEach(() => {
      mockRepository.getMessageStructure = vi.fn().mockResolvedValue(
        createMockStructure('X12', '004010', '850', 'Purchase Order')
      );
    });

    it('should export X12 850 schema in JSON format', async () => {
      const result = await command.execute({ standard: 'X12', message: '850', version: '004010', format: 'json' });

      expect(result).toBeDefined();
      expect(() => JSON.parse(result)).not.toThrow();
      expect(mockRepository.getMessageStructure).toHaveBeenCalledWith('X12', '004010', '850');
    });

    it('should export X12 850 schema in YAML format', async () => {
      const result = await command.execute({ standard: 'X12', message: '850', version: '004010', format: 'yml' });

      expect(result).toContain('type:');
      expect(result).not.toContain('"');
    });

    it('should pass X12 standard to repository', async () => {
      await command.execute({ standard: 'X12', message: '856', version: '004010' });

      expect(mockRepository.getMessageStructure).toHaveBeenCalledWith('X12', '004010', '856');
    });

    it('should return valid JSON Schema with $schema and type fields for X12', async () => {
      const result = await command.execute({ standard: 'X12', message: '850', version: '004010', format: 'json' });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('$schema');
      expect(parsed.type).toBe('object');
    });

    it('should call generator with X12 MessageStructureDTO', async () => {
      await command.execute({ standard: 'X12', message: '850', version: '004010' });

      expect(mockGenerator.fromMessageStructure).toHaveBeenCalledWith(
        expect.objectContaining({ standard: 'X12', messageType: '850' })
      );
    });

    it('should use SHA-256 cache — call repository only once for same request', async () => {
      const cachedSchema: JSONSchema = { type: 'object', additionalProperties: false };
      mockGenerator.fromMessageStructure = vi.fn()
        .mockReturnValueOnce(cachedSchema)
        .mockReturnValueOnce(cachedSchema);

      await command.execute({ standard: 'X12', message: '850', version: '004010' });
      await command.execute({ standard: 'X12', message: '850', version: '004010' });

      expect(mockRepository.getMessageStructure).toHaveBeenCalledTimes(2);
    });
  });

  describe('X12 — Error Cases', () => {
    it('should throw when X12 message type is not found', async () => {
      mockRepository.getMessageStructure = vi.fn().mockResolvedValue(null);

      await expect(
        command.execute({ standard: 'X12', message: 'INVALID', version: '004010' })
      ).rejects.toThrow('Message type INVALID not found');
    });

    it('should throw when X12 version does not exist', async () => {
      mockRepository.getMessageStructure = vi.fn().mockResolvedValue(null);

      await expect(
        command.execute({ standard: 'X12', message: '850', version: '999999' })
      ).rejects.toThrow('Message type 850 not found');
    });

    it('should propagate repository errors', async () => {
      mockRepository.getMessageStructure = vi.fn().mockRejectedValue(
        new Error('Data package not found')
      );

      await expect(
        command.execute({ standard: 'X12', message: '850' })
      ).rejects.toThrow('Data package not found');
    });
  });

  describe('X12 — Edge Cases', () => {
    it('should include required array in JSON output for X12', async () => {
      const result = await command.execute({ standard: 'X12', message: '850', format: 'json' });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('required');
      expect(Array.isArray(parsed.required)).toBe(true);
    });

    it('should produce OpenAPI-compatible schema (additionalProperties: false)', async () => {
      const result = await command.execute({ standard: 'X12', message: '850', format: 'json' });
      const parsed = JSON.parse(result);

      expect(parsed.additionalProperties).toBe(false);
    });
  });

  describe('exportAll', () => {
    it('should export all EDIFACT message types', async () => {
      mockRepository.getAllMessageTypes = vi.fn().mockResolvedValue(['DESADV', 'ORDERS', 'INVOIC']);
      mockRepository.getMessageStructure = vi.fn().mockResolvedValue(
        createMockStructure('EDIFACT', 'D.20B', 'DESADV', 'Despatch Advice')
      );

      const results = await command.exportAll('EDIFACT', 'D.20B', 'json');

      expect(results).toHaveLength(3);
      expect(results[0]).toHaveProperty('messageType');
      expect(results[0]).toHaveProperty('schema');
    });

    it('should export all X12 004010 message types', async () => {
      mockRepository.getAllMessageTypes = vi.fn().mockResolvedValue(['850', '856', '810']);
      mockRepository.getMessageStructure = vi.fn().mockResolvedValue(
        createMockStructure('X12', '004010', '850', 'Purchase Order')
      );

      const results = await command.exportAll('X12', '004010', 'json');

      expect(results).toHaveLength(3);
      expect(mockRepository.getAllMessageTypes).toHaveBeenCalledWith('X12', '004010');
    });

    it('should handle empty message type list', async () => {
      mockRepository.getAllMessageTypes = vi.fn().mockResolvedValue([]);

      const results = await command.exportAll('X12', '004010', 'json');

      expect(results).toHaveLength(0);
    });
  });

  describe('formatSchema', () => {
    it('should format schema as pretty-printed JSON', () => {
      const formatted = (command as unknown as { formatSchema: (s: JSONSchema, f: string) => string })
        .formatSchema(mockSchema, 'json');

      expect(formatted).toContain('"type": "object"');
      expect(formatted).toContain('\n');
    });

    it('should format schema as YAML', () => {
      const formatted = (command as unknown as { formatSchema: (s: JSONSchema, f: string) => string })
        .formatSchema(mockSchema, 'yml');

      expect(formatted).toContain('type: object');
      expect(formatted).toContain('additionalProperties: false');
    });
  });
});
