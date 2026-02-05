import { describe, it, expect, beforeEach } from 'vitest';
import { MessageStructureService } from './MessageStructureService';
import { InMemoryMessageStructureRepository } from '@infrastructure/repositories/InMemoryMessageStructureRepository';
import type { MessageStructureDTO } from '@infrastructure/repositories/dtos';
import { Standard } from '@domain/value-objects/Standard';

describe('MessageStructureService', () => {
  let service: MessageStructureService;
  let repository: InMemoryMessageStructureRepository;

  beforeEach(() => {
    repository = new InMemoryMessageStructureRepository();
    service = new MessageStructureService(repository);
  });

  describe('getMessageDefinition', () => {
    it('should return message definition when it exists', async () => {
      const definition: MessageStructureDTO = {
        standard: Standard.EDIFACT,
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order message',
        structure: []
      };

      repository.register(definition);

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
      repository.register({
        standard: Standard.EDIFACT,
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Orders',
        structure: []
      });

      repository.register({
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
      repository.register({
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
