import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CachingMessageStructureRepository } from './CachingMessageStructureRepository';
import type { IMessageStructureRepository, MessageStructureDTO } from '@ediflow/core';

describe('CachingMessageStructureRepository', () => {
  let repository: CachingMessageStructureRepository;
  let mockRepository: IMessageStructureRepository;

  const standard = 'EDIFACT';
  const version = 'D.96A';
  const messageType = 'ORDERS';

  const mockStructure: MessageStructureDTO = {
    standard: 'EDIFACT',
    version: 'D.96A',
    messageType: 'ORDERS',
    name: 'Purchase Order',
    structure: [],
  };

  beforeEach(() => {
    mockRepository = {
      getMessageStructure: vi.fn(async () => mockStructure),
      getAllMessageTypes: vi.fn(async () => ['ORDERS', 'INVOIC']),
      hasMessageStructure: vi.fn(async () => true),
      getCodeList: vi.fn(async () => null)
    };

    repository = new CachingMessageStructureRepository(mockRepository);
  });

  describe('getMessageStructure', () => {
    it('should load structure from repository', async () => {
      const result = await repository.getMessageStructure(standard, version, messageType);

      expect(result).toEqual(mockStructure);
      expect(mockRepository.getMessageStructure).toHaveBeenCalledWith('EDIFACT', 'D.96A', 'ORDERS');
    });

    it('should cache structures after first load', async () => {
      await repository.getMessageStructure(standard, version, messageType);
      await repository.getMessageStructure(standard, version, messageType);

      expect(mockRepository.getMessageStructure).toHaveBeenCalledTimes(1);
    });

    it('should return null when structure not found', async () => {
      mockRepository.getMessageStructure = vi.fn(async () => null);

      const result = await repository.getMessageStructure(standard, version, messageType);

      expect(result).toBeNull();
    });
  });

  describe('hasMessageStructure', () => {
    it('should return true when structure exists in repository', async () => {
      const result = await repository.hasMessageStructure(standard, version, messageType);

      expect(result).toBe(true);
    });

    it('should return false when structure does not exist', async () => {
      mockRepository.hasMessageStructure = vi.fn(async () => false);

      const result = await repository.hasMessageStructure(standard, version, messageType);

      expect(result).toBe(false);
    });

    it('should check cache first', async () => {
      await repository.getMessageStructure(standard, version, messageType);

      const result = await repository.hasMessageStructure(standard, version, messageType);

      expect(result).toBe(true);
      expect(mockRepository.hasMessageStructure).not.toHaveBeenCalled();
    });
  });

  describe('getAllMessageTypes', () => {
    it('should delegate to repository', async () => {
      const result = await repository.getAllMessageTypes('EDIFACT', 'D.96A');

      expect(result).toEqual(['ORDERS', 'INVOIC']);
      expect(mockRepository.getAllMessageTypes).toHaveBeenCalledWith('EDIFACT', 'D.96A');
    });
  });
});
