import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRepository } from './InMemoryRepository';
import { MessageType, Version, Standard } from '../../domain';
import type { MessageDefinition } from '../../domain/repositories/MessageDefinition';

describe('InMemoryRepository', () => {
  let repository: InMemoryRepository;
  let sampleDefinition: MessageDefinition;

  beforeEach(() => {
    repository = new InMemoryRepository();

    // Create a sample ORDERS D.96A definition
    sampleDefinition = {
      messageType: new MessageType(Standard.EDIFACT, 'ORDERS'),
      version: new Version(Standard.EDIFACT, 'D.96A'),
      standard: Standard.EDIFACT,
      segments: [
        { tag: 'UNH', name: 'Message Header', mandatory: true, maxOccurrences: 1 },
        { tag: 'BGM', name: 'Beginning of Message', mandatory: true, maxOccurrences: 1 },
        { tag: 'DTM', name: 'Date/Time/Period', mandatory: false, maxOccurrences: 10 },
        { tag: 'UNT', name: 'Message Trailer', mandatory: true, maxOccurrences: 1 },
      ],
    };
  });

  describe('register', () => {
    it('should register a message definition', () => {
      repository.register(sampleDefinition);

      const retrieved = repository.getMessageDefinition(
        sampleDefinition.messageType,
        sampleDefinition.version
      );

      expect(retrieved).toBeDefined();
      expect(retrieved).toBe(sampleDefinition);
    });

    it('should allow registering multiple definitions', () => {
      const ordersDefinition = sampleDefinition;
      const invoicDefinition: MessageDefinition = {
        messageType: new MessageType(Standard.EDIFACT, 'INVOIC'),
        version: new Version(Standard.EDIFACT, 'D.96A'),
        standard: Standard.EDIFACT,
        segments: [
          { tag: 'UNH', name: 'Message Header', mandatory: true, maxOccurrences: 1 },
          { tag: 'BGM', name: 'Beginning of Message', mandatory: true, maxOccurrences: 1 },
          { tag: 'UNT', name: 'Message Trailer', mandatory: true, maxOccurrences: 1 },
        ],
      };

      repository.register(ordersDefinition);
      repository.register(invoicDefinition);

      expect(repository.getMessageDefinition(ordersDefinition.messageType, ordersDefinition.version)).toBe(ordersDefinition);
      expect(repository.getMessageDefinition(invoicDefinition.messageType, invoicDefinition.version)).toBe(invoicDefinition);
    });

    it('should allow registering same message type with different versions', () => {
      const orders96A = sampleDefinition;
      const orders01B: MessageDefinition = {
        messageType: new MessageType(Standard.EDIFACT, 'ORDERS'),
        version: new Version(Standard.EDIFACT, 'D.01B'),
        standard: Standard.EDIFACT,
        segments: [
          { tag: 'UNH', name: 'Message Header', mandatory: true, maxOccurrences: 1 },
          { tag: 'BGM', name: 'Beginning of Message', mandatory: true, maxOccurrences: 1 },
          { tag: 'UNT', name: 'Message Trailer', mandatory: true, maxOccurrences: 1 },
        ],
      };

      repository.register(orders96A);
      repository.register(orders01B);

      expect(repository.getMessageDefinition(orders96A.messageType, orders96A.version)).toBe(orders96A);
      expect(repository.getMessageDefinition(orders01B.messageType, orders01B.version)).toBe(orders01B);
    });

    it('should overwrite existing definition when registering same type and version', () => {
      const firstDefinition = sampleDefinition;
      const updatedDefinition: MessageDefinition = {
        messageType: new MessageType(Standard.EDIFACT, 'ORDERS'),
        version: new Version(Standard.EDIFACT, 'D.96A'),
        standard: Standard.EDIFACT,
        segments: [
          { tag: 'UNH', name: 'Message Header', mandatory: true, maxOccurrences: 1 },
          { tag: 'UNT', name: 'Message Trailer', mandatory: true, maxOccurrences: 1 },
        ],
      };

      repository.register(firstDefinition);
      repository.register(updatedDefinition);

      const retrieved = repository.getMessageDefinition(firstDefinition.messageType, firstDefinition.version);
      expect(retrieved).toBe(updatedDefinition);
      expect(retrieved?.segments.length).toBe(2);
    });
  });

  describe('getMessageDefinition', () => {
    it('should return null for non-existent definition', () => {
      const nonExistentType = new MessageType(Standard.EDIFACT, 'DESADV');
      const nonExistentVersion = new Version(Standard.EDIFACT, 'D.96A');

      const result = repository.getMessageDefinition(nonExistentType, nonExistentVersion);

      expect(result).toBeNull();
    });

    it('should return null for non-existent version of existing message type', () => {
      repository.register(sampleDefinition);

      const differentVersion = new Version(Standard.EDIFACT, 'D.01B');
      const result = repository.getMessageDefinition(sampleDefinition.messageType, differentVersion);

      expect(result).toBeNull();
    });

    it('should retrieve registered definition correctly', () => {
      repository.register(sampleDefinition);

      const retrieved = repository.getMessageDefinition(
        sampleDefinition.messageType,
        sampleDefinition.version
      );

      expect(retrieved).toBe(sampleDefinition);
      expect(retrieved?.messageType.value).toBe('ORDERS');
      expect(retrieved?.version.value).toBe('D.96A');
      expect(retrieved?.segments.length).toBe(4);
    });
  });

  describe('hasMessageDefinition', () => {
    it('should return false for non-existent definition', () => {
      const nonExistentType = new MessageType(Standard.EDIFACT, 'DESADV');
      const nonExistentVersion = new Version(Standard.EDIFACT, 'D.96A');

      expect(repository.hasMessageDefinition(nonExistentType, nonExistentVersion)).toBe(false);
    });

    it('should return true for existing definition', () => {
      repository.register(sampleDefinition);

      expect(repository.hasMessageDefinition(sampleDefinition.messageType, sampleDefinition.version)).toBe(true);
    });

    it('should return false after registering different version', () => {
      repository.register(sampleDefinition);

      const differentVersion = new Version(Standard.EDIFACT, 'D.01B');
      expect(repository.hasMessageDefinition(sampleDefinition.messageType, differentVersion)).toBe(false);
    });
  });
});
