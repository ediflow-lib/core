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
    version: new Version(Standard.EDIFACT, 'D.96A'),
    messageType: new MessageType(Standard.EDIFACT, 'ORDERS'),
    segments: [
      {
        tag: 'UNH',
        name: 'Message Header',
        mandatory: true,
        maxOccurrences: 1,
      },
      {
        tag: 'BGM',
        name: 'Beginning of Message',
        mandatory: true,
        maxOccurrences: 1,
      },
      {
        tag: 'UNT',
        name: 'Message Trailer',
        mandatory: true,
        maxOccurrences: 1,
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

    // ...existing code...
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
      expect(definition.version.value).toBe('D.96A');
      expect(definition.messageType.value).toBe('ORDERS');
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
});
