import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CachedDefinitionLoader } from './CachedDefinitionLoader';
import type { IMessageStructureRepository, Standard, Version, MessageType, MessageStructureDTO } from '@ediflow/core';

describe('CachedDefinitionLoader', () => {
  let loader: CachedDefinitionLoader;
  let mockRepository: IMessageStructureRepository;

  const standard = 'EDIFACT' as Standard;
  const version = { value: 'D.96A' } as Version;
  const messageType = { value: 'ORDERS' } as MessageType;

  const mockDefinition: MessageStructureDTO = {
    standard: 'EDIFACT',
    version: 'D.96A',
    messageType: 'ORDERS',
    name: 'Purchase Order',
    structure: [],
  };

  beforeEach(() => {
    mockRepository = {
      getMessageDefinition: vi.fn(async () => mockDefinition),
      getAllMessageTypes: vi.fn(async () => ['ORDERS', 'INVOIC']),
      hasMessageDefinition: vi.fn(async () => true)
    };

    loader = new CachedDefinitionLoader(mockRepository);
  });

  describe('loadDefinition', () => {
    it('should load definition from repository', async () => {
      const result = await loader.loadDefinition(standard, version, messageType);

      expect(result).toEqual(mockDefinition);
      expect(mockRepository.getMessageDefinition).toHaveBeenCalledWith('EDIFACT', 'D.96A', 'ORDERS');
    });

    it('should cache definitions after first load', async () => {
      await loader.loadDefinition(standard, version, messageType);
      await loader.loadDefinition(standard, version, messageType);

      expect(mockRepository.getMessageDefinition).toHaveBeenCalledTimes(1);
    });

    it('should throw error when definition not found', async () => {
      mockRepository.getMessageDefinition = vi.fn(async () => null);

      expect(
        loader.loadDefinition(standard, version, messageType)
      ).rejects.toThrow();
    });
  });

  describe('hasDefinition', () => {
    it('should return true when definition exists in repository', async () => {
      const result = await loader.hasDefinition(standard, version, messageType);

      expect(result).toBe(true);
    });

    it('should return false when definition does not exist', async () => {
      mockRepository.hasMessageDefinition = vi.fn(async () => false);

      const result = await loader.hasDefinition(standard, version, messageType);

      expect(result).toBe(false);
    });

    it('should check cache first', async () => {

      await loader.loadDefinition(standard, version, messageType);

      const result = await loader.hasDefinition(standard, version, messageType);

      expect(result).toBe(true);

      expect(mockRepository.hasMessageDefinition).not.toHaveBeenCalled();
    });
  });
});
