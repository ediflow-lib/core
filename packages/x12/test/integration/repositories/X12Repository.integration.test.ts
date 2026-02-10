import { describe, it, expect, beforeEach } from 'vitest';
import { FileBasedMessageStructureRepository } from '@ediflow/infrastructure-shared';
import * as path from 'path';

describe('X12 Repository Integration Tests', () => {
  let repository: FileBasedMessageStructureRepository;
  const basePath = path.join(__dirname, '../../../..');

  beforeEach(() => {
    repository = new FileBasedMessageStructureRepository(basePath);
  });

  describe('X12 004010 Repository', () => {
    it('should load 850 Purchase Order definition from x12-004010 package', async () => {
      const definition = await repository.getMessageDefinition('X12', '004010', '850');

      expect(definition).toBeDefined();
      expect(definition?.messageType).toBe('850');
      expect(definition?.standard).toBe('X12');
      expect(definition?.version).toBe('004010');
      expect(definition?.name).toBe('Purchase Order');
    });

    it('should list all available message types in x12-004010', async () => {
      const messageTypes = await repository.getAllMessageTypes('X12', '004010');

      expect(messageTypes).toBeDefined();
      expect(Array.isArray(messageTypes)).toBe(true);
      expect(messageTypes).toContain('850');
    });

    it('should check if 850 message exists in x12-004010', async () => {
      const exists = await repository.hasMessageDefinition('X12', '004010', '850');

      expect(exists).toBe(true);
    });

    it('should return null for non-existent message type', async () => {
      const definition = await repository.getMessageDefinition('X12', '004010', 'NONEXISTENT');

      expect(definition).toBeNull();
    });

    it('should return false for non-existent message type check', async () => {
      const exists = await repository.hasMessageDefinition('X12', '004010', 'NONEXISTENT');

      expect(exists).toBe(false);
    });
  });

  describe('X12 005010 Repository', () => {
    it('should load 850 Purchase Order definition from x12-005010 package', async () => {
      const definition = await repository.getMessageDefinition('X12', '005010', '850');

      expect(definition).toBeDefined();
      expect(definition?.messageType).toBe('850');
      expect(definition?.standard).toBe('X12');
      expect(definition?.version).toBe('005010');
      expect(definition?.name).toBe('Purchase Order');
    });

    it('should list all available message types in x12-005010', async () => {
      const messageTypes = await repository.getAllMessageTypes('X12', '005010');

      expect(messageTypes).toBeDefined();
      expect(Array.isArray(messageTypes)).toBe(true);
      expect(messageTypes).toContain('850');
    });

    it('should check if 850 message exists in x12-005010', async () => {
      const exists = await repository.hasMessageDefinition('X12', '005010', '850');

      expect(exists).toBe(true);
    });
  });

  describe('Version Handling', () => {
    it('should handle version with leading zeros', async () => {
      const definition = await repository.getMessageDefinition('X12', '004010', '850');

      expect(definition).toBeDefined();
    });

    it('should handle version without leading zeros', async () => {
      const definition = await repository.getMessageDefinition('X12', '4010', '850');

      expect(definition).toBeDefined();
    });

    it('should handle different version formats consistently', async () => {
      const def1 = await repository.getMessageDefinition('X12', '005010', '850');
      const def2 = await repository.getMessageDefinition('X12', '5010', '850');

      expect(def1).toBeDefined();
      expect(def2).toBeDefined();
      if (def1 && def2) {
        expect(def1.messageType).toBe('850');
        expect(def2.messageType).toBe('850');
      }
    });
  });

  describe('Segment Structure', () => {
    it('should include segment definitions in message structure', async () => {
      const definition = await repository.getMessageDefinition('X12', '005010', '850');

      expect(definition?.structure).toBeDefined();
      expect(Array.isArray(definition?.structure)).toBe(true);
      expect(definition?.structure.length).toBeGreaterThan(0);
    });

    it('should have ST segment as first segment', async () => {
      const definition = await repository.getMessageDefinition('X12', '005010', '850');

      const firstSegment = definition?.structure[0];
      expect(firstSegment?.nodeType).toBe('segment');
      if (firstSegment?.nodeType === 'segment') {
        expect(firstSegment.tag).toBe('ST');
        expect(firstSegment.name).toBe('Transaction Set Header');
        expect(firstSegment.mandatory).toBe(true);
      }
    });

    it('should have SE segment as last segment', async () => {
      const definition = await repository.getMessageDefinition('X12', '005010', '850');

      const lastSegment = definition?.structure[definition.structure.length - 1];
      expect(lastSegment?.nodeType).toBe('segment');
      if (lastSegment?.nodeType === 'segment') {
        expect(lastSegment.tag).toBe('SE');
        expect(lastSegment.name).toBe('Transaction Set Trailer');
        expect(lastSegment.mandatory).toBe(true);
      }
    });

    it('should have BEG segment for Purchase Order', async () => {
      const definition = await repository.getMessageDefinition('X12', '005010', '850');

      const begSegment = definition?.structure.find(
        (s): s is import('@ediflow/core').SegmentNode => s.nodeType === 'segment' && s.tag === 'BEG'
      );
      expect(begSegment).toBeDefined();
      expect(begSegment?.name).toBe('Beginning Segment for Purchase Order');
      expect(begSegment?.mandatory).toBe(true);
    });
  });
});


