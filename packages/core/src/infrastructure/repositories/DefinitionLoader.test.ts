import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DefinitionLoader } from './DefinitionLoader';
import { RepositoryManager } from '@application/services/RepositoryManager';
import { Standard, Version, MessageType } from '@domain';
import { DefinitionNotFoundError } from '@domain/errors/DefinitionNotFoundError';
import type { IRepository } from '@application/ports';
import type { MessageDefinition } from '@domain/repositories/MessageDefinition';

describe('DefinitionLoader', () => {
  let definitionLoader: DefinitionLoader;
  let mockRepositoryManager: RepositoryManager;
  let mockRepository: IRepository;

  const mockDefinition: MessageDefinition = {
    standard: Standard.EDIFACT,
    version: 'D.96A',
    messageType: 'ORDERS',
    name: 'Purchase Order',
    segments: [
      {
        tag: 'UNH',
        name: 'Message Header',
        mandatory: true,
        maxOccurrences: 1,
        position: 1,
      },
      {
        tag: 'BGM',
        name: 'Beginning of Message',
        mandatory: true,
        maxOccurrences: 1,
        position: 2,
      },
      {
        tag: 'UNT',
        name: 'Message Trailer',
        mandatory: true,
        maxOccurrences: 1,
        position: 3,
      },
    ],
  };

  beforeEach(() => {
    // Mock repository
    mockRepository = {
      getMessageDefinition: vi.fn().mockReturnValue(mockDefinition),
      hasMessageDefinition: vi.fn().mockReturnValue(true),
      getStandard: vi.fn().mockReturnValue(Standard.EDIFACT),
      getVersions: vi.fn().mockReturnValue([new Version(Standard.EDIFACT, 'D.96A')]),
    };

    // Mock repository manager
    mockRepositoryManager = {
      findRepository: vi.fn().mockReturnValue(mockRepository),
    } as any;

    definitionLoader = new DefinitionLoader(mockRepositoryManager);
  });

  describe('loadDefinition', () => {
    it('should load definition from repository', () => {
      // GIVEN
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      // WHEN
      const definition = definitionLoader.loadDefinition(standard, version, messageType);

      // THEN
      expect(definition).toBeDefined();
      expect(definition.standard).toBe(Standard.EDIFACT);
      expect(definition.version).toBe('D.96A');
      expect(definition.messageType).toBe('ORDERS');
      expect(definition.segments).toHaveLength(3);
    });

    it('should call repositoryManager.findRepository with correct standard and version', () => {
      // GIVEN
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      // WHEN
      definitionLoader.loadDefinition(standard, version, messageType);

      // THEN
      expect(mockRepositoryManager.findRepository).toHaveBeenCalledWith(standard, version);
    });

    it('should call repository.getMessageDefinition with correct messageType and version', () => {
      // GIVEN
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      // WHEN
      definitionLoader.loadDefinition(standard, version, messageType);

      // THEN
      expect(mockRepository.getMessageDefinition).toHaveBeenCalledWith(messageType, version);
    });

    it('should throw DefinitionNotFoundError if repository not found', () => {
      // GIVEN
      mockRepositoryManager.findRepository = vi.fn().mockReturnValue(null);
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      // WHEN / THEN
      expect(() => {
        definitionLoader.loadDefinition(standard, version, messageType);
      }).toThrow(DefinitionNotFoundError);
    });

    it('should throw DefinitionNotFoundError if repository has no definition', () => {
      // GIVEN
      mockRepository.getMessageDefinition = vi.fn().mockReturnValue(null);
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      // WHEN / THEN
      expect(() => {
        definitionLoader.loadDefinition(standard, version, messageType);
      }).toThrow(DefinitionNotFoundError);
    });
  });

  describe('hasDefinition', () => {
    it('should return true if repository has definition', () => {
      // GIVEN
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      // WHEN
      const result = definitionLoader.hasDefinition(standard, version, messageType);

      // THEN
      expect(result).toBe(true);
    });

    it('should return false if repository not found', () => {
      // GIVEN
      mockRepositoryManager.findRepository = vi.fn().mockReturnValue(null);
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      // WHEN
      const result = definitionLoader.hasDefinition(standard, version, messageType);

      // THEN
      expect(result).toBe(false);
    });

    it('should return false if repository has no definition', () => {
      // GIVEN
      mockRepository.hasMessageDefinition = vi.fn().mockReturnValue(false);
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      // WHEN
      const result = definitionLoader.hasDefinition(standard, version, messageType);

      // THEN
      expect(result).toBe(false);
    });
  });

  describe('caching', () => {
    it('should cache loaded definitions', () => {
      // GIVEN
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      // WHEN: Load twice
      definitionLoader.loadDefinition(standard, version, messageType);
      definitionLoader.loadDefinition(standard, version, messageType);

      // THEN: Repository should be called only once (second is cached)
      expect(mockRepository.getMessageDefinition).toHaveBeenCalledTimes(1);
    });

    it('should return cached definition on second call', () => {
      // GIVEN
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      // WHEN
      const def1 = definitionLoader.loadDefinition(standard, version, messageType);
      const def2 = definitionLoader.loadDefinition(standard, version, messageType);

      // THEN: Same instance returned
      expect(def1).toBe(def2);
    });

    it('should check cache before repository in hasDefinition', () => {
      // GIVEN: Load to populate cache
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      definitionLoader.loadDefinition(standard, version, messageType);

      // WHEN: Check if exists
      const exists = definitionLoader.hasDefinition(standard, version, messageType);

      // THEN: Should return true without checking repository again
      expect(exists).toBe(true);
      // Repository getMessageDefinition was called once during load, not during hasDefinition
      expect(mockRepository.getMessageDefinition).toHaveBeenCalledTimes(1);
    });

    it('should clear cache', () => {
      // GIVEN: Load and cache
      const standard = Standard.EDIFACT;
      const version = new Version(Standard.EDIFACT, 'D.96A');
      const messageType = new MessageType(Standard.EDIFACT, 'ORDERS');

      definitionLoader.loadDefinition(standard, version, messageType);
      expect(definitionLoader.getCacheSize()).toBe(1);

      // WHEN: Clear cache
      definitionLoader.clearCache();

      // THEN: Cache is empty
      expect(definitionLoader.getCacheSize()).toBe(0);

      // Loading again should call repository
      mockRepository.getMessageDefinition = vi.fn().mockReturnValue(mockDefinition);
      definitionLoader.loadDefinition(standard, version, messageType);
      expect(mockRepository.getMessageDefinition).toHaveBeenCalledTimes(1);
    });

    it('should respect custom cache size', () => {
      // GIVEN: Small cache
      const smallCacheLoader = new DefinitionLoader(mockRepositoryManager, 2);
      const standard = Standard.EDIFACT;

      // WHEN: Load 3 definitions
      smallCacheLoader.loadDefinition(
        standard,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );
      smallCacheLoader.loadDefinition(
        standard,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'INVOIC')
      );
      smallCacheLoader.loadDefinition(
        standard,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'DESADV')
      );

      // THEN: Cache size should be 2 (LRU evicted oldest)
      expect(smallCacheLoader.getCacheSize()).toBe(2);
    });
  });
});
