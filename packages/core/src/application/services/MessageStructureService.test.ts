import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageStructureService } from '@application';
import type { IMessageStructureRepository } from '@application/ports/output/IMessageStructureRepository';
import type { MessageStructureDTO } from '@application/dtos';
import { Standard } from '@domain/value-objects/Standard';

describe('MessageStructureService', () => {
  let service: MessageStructureService;
  let mockRepository: IMessageStructureRepository;
  const structures = new Map<string, MessageStructureDTO>();

  beforeEach(() => {
    structures.clear();

    mockRepository = {
      getMessageStructure: vi.fn(async (standard: string, version: string, messageType: string) => {
        const key = `${standard}:${version}:${messageType}`;
        return structures.get(key) || null;
      }),
      getAllMessageTypes: vi.fn(async (standard: string, version: string) => {
        const prefix = `${standard}:${version}:`;
        return Array.from(structures.keys())
          .filter(key => key.startsWith(prefix))
          .map(key => key.split(':')[2])
          .filter((type): type is string => type !== undefined);
      }),
      hasMessageStructure: vi.fn(async (standard: string, version: string, messageType: string) => {
        const key = `${standard}:${version}:${messageType}`;
        return structures.has(key);
      })
    };

    service = new MessageStructureService(mockRepository);
  });

  const registerStructure = (structure: MessageStructureDTO) => {
    const key = `${structure.standard}:${structure.version}:${structure.messageType}`;
    structures.set(key, structure);
  };

  describe('getMessageStructure', () => {
    it('should return message structure when it exists', async () => {
      const structure: MessageStructureDTO = {
        standard: Standard.EDIFACT,
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order message',
        structure: []
      };

      registerStructure(structure);

      const result = await service.getMessageStructure('EDIFACT', 'D.20B', 'ORDERS');

      expect(result).toEqual(structure);
    });

    it('should throw error when message structure not found', async () => {
      expect(
        service.getMessageStructure('EDIFACT', 'D.20B', 'UNKNOWN')
      ).rejects.toThrow('Message structure not found: EDIFACT D.20B UNKNOWN');
    });
  });

  describe('getAllMessageTypes', () => {
    it('should return all message types', async () => {
      registerStructure({
        standard: Standard.EDIFACT,
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Orders',
        structure: []
      });

      registerStructure({
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

  describe('hasMessageStructure', () => {
    it('should return true when message exists', async () => {
      registerStructure({
        standard: Standard.EDIFACT,
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Orders',
        structure: []
      });

      const result = await service.hasMessageStructure('EDIFACT', 'D.20B', 'ORDERS');

      expect(result).toBe(true);
    });

    it('should return false when message does not exist', async () => {
      const result = await service.hasMessageStructure('EDIFACT', 'D.20B', 'UNKNOWN');

      expect(result).toBe(false);
    });
  });
});
