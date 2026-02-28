import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryMessageStructureRepository } from './InMemoryMessageStructureRepository';
import { Standard } from '@ediflow/core';
import type { MessageStructureDTO } from '@ediflow/core';

describe('InMemoryMessageStructureRepository', () => {
  let repository: InMemoryMessageStructureRepository;

  beforeEach(() => {
    repository = new InMemoryMessageStructureRepository();
  });

  describe('register and getMessageStructure', () => {
    it('should register and retrieve message structure', async () => {
      const structure: MessageStructureDTO = {
        standard: Standard.EDIFACT,
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order message',
        structure: []
      };

      repository.register(structure);

      const result = await repository.getMessageStructure('EDIFACT', 'D.20B', 'ORDERS');

      expect(result).toEqual(structure);
    });

    it('should return null for non-existing message', async () => {
      const result = await repository.getMessageStructure('EDIFACT', 'D.20B', 'UNKNOWN');

      expect(result).toBeNull();
    });

    it('should be case-insensitive for standard and version', async () => {
      const structure: MessageStructureDTO = {
        standard: Standard.EDIFACT,
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order message',
        structure: []
      };

      repository.register(structure);

      const result = await repository.getMessageStructure('edifact', 'd.20b', 'ORDERS');

      expect(result).toEqual(structure);
    });

    it('should normalize message type to uppercase', async () => {
      const structure: MessageStructureDTO = {
        standard: Standard.EDIFACT,
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order message',
        structure: []
      };

      repository.register(structure);

      const result = await repository.getMessageStructure('EDIFACT', 'D.20B', 'orders');

      expect(result).toEqual(structure);
    });
  });

  describe('getAllMessageTypes', () => {
    it('should return all message types for standard and version', async () => {
      repository.register({
        standard: Standard.EDIFACT, version: 'D.20B', messageType: 'ORDERS', name: 'Orders', structure: []
      });
      repository.register({
        standard: Standard.EDIFACT, version: 'D.20B', messageType: 'INVOIC', name: 'Invoice', structure: []
      });
      repository.register({
        standard: Standard.EDIFACT, version: 'D.96A', messageType: 'ORDERS', name: 'Orders', structure: []
      });

      const result = await repository.getAllMessageTypes('EDIFACT', 'D.20B');

      expect(result).toHaveLength(2);
      expect(result).toContain('ORDERS');
      expect(result).toContain('INVOIC');
    });

    it('should return empty array for non-existing standard', async () => {
      const result = await repository.getAllMessageTypes('X12', '5010');

      expect(result).toEqual([]);
    });
  });

  describe('hasMessageStructure', () => {
    it('should return true for existing message', async () => {
      repository.register({
        standard: Standard.EDIFACT, version: 'D.20B', messageType: 'ORDERS', name: 'Orders', structure: []
      });

      const result = await repository.hasMessageStructure('EDIFACT', 'D.20B', 'ORDERS');

      expect(result).toBe(true);
    });

    it('should return false for non-existing message', async () => {
      const result = await repository.hasMessageStructure('EDIFACT', 'D.20B', 'UNKNOWN');

      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all registered structures', async () => {
      repository.register({
        standard: Standard.EDIFACT, version: 'D.20B', messageType: 'ORDERS', name: 'Orders', structure: []
      });

      repository.clear();

      const result = await repository.getMessageStructure('EDIFACT', 'D.20B', 'ORDERS');

      expect(result).toBeNull();
    });
  });
});
