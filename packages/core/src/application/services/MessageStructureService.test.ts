import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageStructureService } from '@application';
import type { IMessageStructureRepository } from '@application/ports/output/IMessageStructureRepository';
import type { MessageStructureDTO } from '@application/dtos';
import { Standard } from '@domain/value-objects/Standard';

describe('MessageStructureService', () => {
  let service: MessageStructureService;
  let mockRepository: IMessageStructureRepository;
  const definitions = new Map<string, MessageStructureDTO>();

  beforeEach(() => {
    definitions.clear();

    mockRepository = {
      getMessageDefinition: vi.fn(async (standard: string, version: string, messageType: string) => {
        const key = `${standard}:${version}:${messageType}`;
        return definitions.get(key) || null;
      }),
      getAllMessageTypes: vi.fn(async (standard: string, version: string) => {
        const prefix = `${standard}:${version}:`;
        return Array.from(definitions.keys())
          .filter(key => key.startsWith(prefix))
          .map(key => key.split(':')[2])
          .filter((type): type is string => type !== undefined);
      }),
      hasMessageDefinition: vi.fn(async (standard: string, version: string, messageType: string) => {
        const key = `${standard}:${version}:${messageType}`;
        return definitions.has(key);
      })
    };

    service = new MessageStructureService(mockRepository);
  });

  const registerDefinition = (definition: MessageStructureDTO) => {
    const key = `${definition.standard}:${definition.version}:${definition.messageType}`;
    definitions.set(key, definition);
  };

  describe('getMessageDefinition', () => {
    it('should return message definition when it exists', async () => {
      const definition: MessageStructureDTO = {
        standard: Standard.EDIFACT,
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order message',
        structure: []
      };

      registerDefinition(definition);

      const result = await service.getMessageDefinition('EDIFACT', 'D.20B', 'ORDERS');

      expect(result).toEqual(definition);
    });

    it('should throw error when message definition not found', async () => {
      expect(
        service.getMessageDefinition('EDIFACT', 'D.20B', 'UNKNOWN')
      ).rejects.toThrow('Message definition not found: EDIFACT D.20B UNKNOWN');
    });
  });

  describe('getAllMessageTypes', () => {
    it('should return all message types', async () => {
      registerDefinition({
        standard: Standard.EDIFACT,
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Orders',
        structure: []
      });

      registerDefinition({
        standard: Standard.EDIFACT,
        version: 'D.20B',
        messageType: 'INVOIC',
        name: 'Invoice',
        structure: []
      });

      const result = await service.getAllMessageTypes('EDIFACT', 'D.20B');

      expect(result).toHaveLength(2);
      expect(result).toContain('ORDERS');
      expect(result).toContain('INVOIC');
    });
  });

  describe('hasMessageDefinition', () => {
    it('should return true when message exists', async () => {
      registerDefinition({
        standard: Standard.EDIFACT,
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Orders',
        structure: []
      });

      const result = await service.hasMessageDefinition('EDIFACT', 'D.20B', 'ORDERS');

      expect(result).toBe(true);
    });

    it('should return false when message does not exist', async () => {
      const result = await service.hasMessageDefinition('EDIFACT', 'D.20B', 'UNKNOWN');

      expect(result).toBe(false);
    });
  });
});
