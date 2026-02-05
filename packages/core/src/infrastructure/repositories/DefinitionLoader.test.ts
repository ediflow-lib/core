import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DefinitionLoader } from './DefinitionLoader';
import { RepositoryManager } from '@application/services/RepositoryManager';
import { Standard, Version, MessageType } from '@domain';
import { DefinitionNotFoundError } from '@domain/errors/DefinitionNotFoundError';
import type { MessageStructureDTO } from './dtos/MessageStructureDTO';

describe('DefinitionLoader', () => {
  let definitionLoader: DefinitionLoader;
  let mockRepositoryManager: RepositoryManager;

  const mockDefinition: MessageStructureDTO = {
    standard: 'EDIFACT',
    version: 'D.96A',
    messageType: 'ORDERS',
    name: 'Purchase Order',
    structure: [
      {
        nodeType: 'segment',
        tag: 'UNH',
        name: 'Message Header',
        mandatory: true,
        maxOccurrences: 1,
        position: 1,
        elements: [],
      },
      {
        nodeType: 'segment',
        tag: 'BGM',
        name: 'Beginning of Message',
        mandatory: true,
        maxOccurrences: 1,
        position: 2,
        elements: [],
      },
      {
        nodeType: 'segment',
        tag: 'UNT',
        name: 'Message Trailer',
        mandatory: true,
        maxOccurrences: 1,
        position: 3,
        elements: [],
      },
    ],
  };

  beforeEach(() => {
    // Mock repository manager
    mockRepositoryManager = {
      findDefinition: vi.fn().mockResolvedValue(mockDefinition),
      hasDefinition: vi.fn().mockResolvedValue(true),
      addRepository: vi.fn(),
      findRepository: vi.fn(),
      getRepositoryCount: vi.fn().mockReturnValue(1),
      clear: vi.fn(),
    } as any;

    definitionLoader = new DefinitionLoader(mockRepositoryManager);
  });

  describe('loadDefinition', () => {
    it('should load definition from repository', async () => {
      // GIVEN
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      // WHEN
      const definition = await definitionLoader.loadDefinition(standard, version, messageType);

      // THEN
      expect(definition).toBeDefined();
      expect(definition.standard).toBe('EDIFACT');
      expect(definition.version).toBe('D.96A');
      expect(definition.messageType).toBe('ORDERS');
      expect(definition.structure).toHaveLength(3);
    });

    it('should call repositoryManager.findDefinition with correct parameters', async () => {
      // GIVEN
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      // WHEN
      await definitionLoader.loadDefinition(standard, version, messageType);

      // THEN
      expect(mockRepositoryManager.findDefinition).toHaveBeenCalledWith(standard, version, 'ORDERS');
    });

    it('should throw DefinitionNotFoundError if definition not found', async () => {
      // GIVEN
      mockRepositoryManager.findDefinition = vi.fn().mockResolvedValue(null);
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      expect(
        definitionLoader.loadDefinition(standard, version, messageType)
      ).rejects.toThrow(DefinitionNotFoundError);
    });
  });

  describe('hasDefinition', () => {
    it('should return true if repository has definition', async () => {
      // GIVEN
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      // WHEN
      const result = await definitionLoader.hasDefinition(standard, version, messageType);

      // THEN
      expect(result).toBe(true);
    });

    it('should return false if definition not found', async () => {
      // GIVEN
      mockRepositoryManager.hasDefinition = vi.fn().mockResolvedValue(false);
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      // WHEN
      const result = await definitionLoader.hasDefinition(standard, version, messageType);

      // THEN
      expect(result).toBe(false);
    });
  });

  describe('caching', () => {
    it('should cache loaded definitions', async () => {
      // GIVEN
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      // WHEN: Load twice
      await definitionLoader.loadDefinition(standard, version, messageType);
      await definitionLoader.loadDefinition(standard, version, messageType);

      // THEN: Repository should be called only once (second is cached)
      expect(mockRepositoryManager.findDefinition).toHaveBeenCalledTimes(1);
    });

    it('should return cached definition on second call', async () => {
      // GIVEN
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      // WHEN
      const firstDefinition = await definitionLoader.loadDefinition(standard, version, messageType);
      const secondDefinition = await definitionLoader.loadDefinition(standard, version, messageType);

      // THEN: Same instance returned
      expect(firstDefinition).toBe(secondDefinition);
    });

    it('should check cache before repository in hasDefinition', async () => {
      // GIVEN: Load to populate cache
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      await definitionLoader.loadDefinition(standard, version, messageType);

      // WHEN: Check if exists
      const exists = await definitionLoader.hasDefinition(standard, version, messageType);

      // THEN: Should return true without checking repository again
      expect(exists).toBe(true);
      // Repository getMessageDefinition was called once during load, not during hasDefinition
      expect(mockRepositoryManager.findDefinition).toHaveBeenCalledTimes(1);
    });

    it('should clear cache', async () => {
      // GIVEN: Load and cache
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      await definitionLoader.loadDefinition(standard, version, messageType);
      expect(definitionLoader.getCacheSize()).toBe(1);

      // WHEN: Clear cache
      definitionLoader.clearCache();

      // THEN: Cache is empty
      expect(definitionLoader.getCacheSize()).toBe(0);

      // Loading again should call repository
      mockRepositoryManager.findDefinition = vi.fn().mockResolvedValue(mockDefinition);
      await definitionLoader.loadDefinition(standard, version, messageType);
      expect(mockRepositoryManager.findDefinition).toHaveBeenCalledTimes(1);
    });

    it('should respect custom cache size', async () => {
      // GIVEN: Small cache
      const smallCacheLoader = new DefinitionLoader(mockRepositoryManager, 2);
      const standard = Standard.EDIFACT;

      // WHEN: Load 3 definitions
      await smallCacheLoader.loadDefinition(
        standard,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );
      await smallCacheLoader.loadDefinition(
        standard,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'INVOIC')
      );
      await smallCacheLoader.loadDefinition(
        standard,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );

      // THEN: Cache size should be 2 (LRU evicted oldest)
      expect(smallCacheLoader.getCacheSize()).toBe(2);
    });
  });
});
