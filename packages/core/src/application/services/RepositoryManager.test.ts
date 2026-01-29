import { describe, it, expect, beforeEach } from 'vitest';
import { RepositoryManager } from './RepositoryManager';
import { InMemoryRepository } from '../../infrastructure/repositories/InMemoryRepository';
import { MessageType, Version, Standard } from '../../domain';
import type { MessageDefinition } from '../../domain';

describe('RepositoryManager', () => {
  let manager: RepositoryManager;
  let repository1: InMemoryRepository;
  let repository2: InMemoryRepository;

  let ordersDefinition: MessageDefinition;
  let invoicDefinition: MessageDefinition;
  let desadvDefinition: MessageDefinition;

  beforeEach(() => {
    manager = new RepositoryManager();
    repository1 = new InMemoryRepository();
    repository2 = new InMemoryRepository();

    // Create sample definitions
    ordersDefinition = {
      messageType: 'ORDERS',
      version: 'D.96A',
      standard: Standard.EDIFACT,
      name: 'Purchase Order',
      segments: [
        { tag: 'UNH', name: 'Message Header', mandatory: true, maxOccurrences: 1, position: 1 },
        { tag: 'BGM', name: 'Beginning of Message', mandatory: true, maxOccurrences: 1, position: 2 },
        { tag: 'UNT', name: 'Message Trailer', mandatory: true, maxOccurrences: 1, position: 3 },
      ],
    };

    invoicDefinition = {
      messageType: 'INVOIC',
      version: 'D.96A',
      standard: Standard.EDIFACT,
      name: 'Invoice',
      segments: [
        { tag: 'UNH', name: 'Message Header', mandatory: true, maxOccurrences: 1, position: 1 },
        { tag: 'BGM', name: 'Beginning of Message', mandatory: true, maxOccurrences: 1, position: 2 },
        { tag: 'UNT', name: 'Message Trailer', mandatory: true, maxOccurrences: 1, position: 3 },
      ],
    };

    desadvDefinition = {
      messageType: 'DESADV',
      version: 'D.01B',
      standard: Standard.EDIFACT,
      name: 'Despatch Advice',
      segments: [
        { tag: 'UNH', name: 'Message Header', mandatory: true, maxOccurrences: 1, position: 1 },
        { tag: 'BGM', name: 'Beginning of Message', mandatory: true, maxOccurrences: 1, position: 2 },
        { tag: 'UNT', name: 'Message Trailer', mandatory: true, maxOccurrences: 1, position: 3 },
      ],
    };
  });

  describe('addRepository', () => {
    it('should add a repository to the manager', () => {
      repository1.register(ordersDefinition);
      manager.addRepository(repository1);

      const result = manager.findDefinition(new MessageType(Standard.EDIFACT, ordersDefinition.messageType), new Version(Standard.EDIFACT, ordersDefinition.version));
      expect(result).toBe(ordersDefinition);
    });

    it('should allow adding multiple repositories', () => {
      repository1.register(ordersDefinition);
      repository2.register(invoicDefinition);

      manager.addRepository(repository1);
      manager.addRepository(repository2);

      expect(manager.findDefinition(new MessageType(Standard.EDIFACT, ordersDefinition.messageType), new Version(Standard.EDIFACT, ordersDefinition.version))).toBe(ordersDefinition);
      expect(manager.findDefinition(new MessageType(Standard.EDIFACT, invoicDefinition.messageType), new Version(Standard.EDIFACT, invoicDefinition.version))).toBe(invoicDefinition);
    });
  });

  describe('findDefinition', () => {
    it('should return null when no repositories are registered', () => {
      const result = manager.findDefinition(new MessageType(Standard.EDIFACT, ordersDefinition.messageType), new Version(Standard.EDIFACT, ordersDefinition.version));
      expect(result).toBeNull();
    });

    it('should return null when definition is not found in any repository', () => {
      repository1.register(ordersDefinition);
      manager.addRepository(repository1);

      const nonExistent = new MessageType(Standard.EDIFACT, 'PRICAT');
      const result = manager.findDefinition(nonExistent, new Version(Standard.EDIFACT, ordersDefinition.version));

      expect(result).toBeNull();
    });

    it('should find definition from first repository', () => {
      repository1.register(ordersDefinition);
      manager.addRepository(repository1);

      const result = manager.findDefinition(new MessageType(Standard.EDIFACT, ordersDefinition.messageType), new Version(Standard.EDIFACT, ordersDefinition.version));
      expect(result).toBe(ordersDefinition);
    });

    it('should find definition from second repository if not in first', () => {
      repository1.register(ordersDefinition);
      repository2.register(invoicDefinition);

      manager.addRepository(repository1);
      manager.addRepository(repository2);

      const result = manager.findDefinition(new MessageType(Standard.EDIFACT, invoicDefinition.messageType), new Version(Standard.EDIFACT, invoicDefinition.version));
      expect(result).toBe(invoicDefinition);
    });

    it('should search repositories in order and return first match', () => {
      // Both repositories have ORDERS, but different definitions
      const ordersV1 = ordersDefinition;
      const ordersV2: MessageDefinition = {
        messageType: 'ORDERS',
        version: 'D.96A',
        standard: Standard.EDIFACT,
        name: 'Purchase Order v2',
        segments: [
          { tag: 'UNH', name: 'Message Header', mandatory: true, maxOccurrences: 1, position: 1 },
          { tag: 'UNT', name: 'Message Trailer', mandatory: true, maxOccurrences: 1, position: 2 },
        ],
      };

      repository1.register(ordersV1);
      repository2.register(ordersV2);

      manager.addRepository(repository1);
      manager.addRepository(repository2);

      const result = manager.findDefinition(new MessageType(Standard.EDIFACT, ordersDefinition.messageType), new Version(Standard.EDIFACT, ordersDefinition.version));
      // Should return the one from repository1 (first in order)
      expect(result).toBe(ordersV1);
      expect(result?.segments.length).toBe(3);
    });

    it('should search all repositories until finding a match', () => {
      repository1.register(ordersDefinition);
      repository2.register(desadvDefinition);

      manager.addRepository(repository1);
      manager.addRepository(repository2);

      // DESADV should be found in repository2
      const result = manager.findDefinition(new MessageType(Standard.EDIFACT, desadvDefinition.messageType), new Version(Standard.EDIFACT, desadvDefinition.version));
      expect(result).toBe(desadvDefinition);
    });
  });

  describe('hasDefinition', () => {
    it('should return false when no repositories are registered', () => {
      expect(manager.hasDefinition(new MessageType(Standard.EDIFACT, ordersDefinition.messageType), new Version(Standard.EDIFACT, ordersDefinition.version))).toBe(false);
    });

    it('should return false when definition is not found', () => {
      repository1.register(ordersDefinition);
      manager.addRepository(repository1);

      const nonExistent = new MessageType(Standard.EDIFACT, 'PRICAT');
      expect(manager.hasDefinition(nonExistent, new Version(Standard.EDIFACT, ordersDefinition.version))).toBe(false);
    });

    it('should return true when definition exists in first repository', () => {
      repository1.register(ordersDefinition);
      manager.addRepository(repository1);

      expect(manager.hasDefinition(new MessageType(Standard.EDIFACT, ordersDefinition.messageType), new Version(Standard.EDIFACT, ordersDefinition.version))).toBe(true);
    });

    it('should return true when definition exists in second repository', () => {
      repository1.register(ordersDefinition);
      repository2.register(invoicDefinition);

      manager.addRepository(repository1);
      manager.addRepository(repository2);

      expect(manager.hasDefinition(new MessageType(Standard.EDIFACT, invoicDefinition.messageType), new Version(Standard.EDIFACT, invoicDefinition.version))).toBe(true);
    });
  });
});
