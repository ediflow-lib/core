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
      const definition = await repository.getMessageStructure('X12', '004010', '850');

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
      const exists = await repository.hasMessageStructure('X12', '004010', '850');

      expect(exists).toBe(true);
    });

    it('should return null for non-existent message type', async () => {
      const definition = await repository.getMessageStructure('X12', '004010', 'NONEXISTENT');

      expect(definition).toBeNull();
    });

    it('should return false for non-existent message type check', async () => {
      const exists = await repository.hasMessageStructure('X12', '004010', 'NONEXISTENT');

      expect(exists).toBe(false);
    });
  });

  describe('X12 006040 Repository', () => {
    it('should load 850 Purchase Order definition from x12-006040 package', async () => {
      const definition = await repository.getMessageStructure('X12', '006040', '850');

      expect(definition).toBeDefined();
      expect(definition?.messageType).toBe('850');
      expect(definition?.standard).toBe('X12');
      expect(definition?.version).toBe('006040');
      expect(definition?.name).toBe('Purchase Order');
    });

    it('should list all available message types in x12-006040', async () => {
      const messageTypes = await repository.getAllMessageTypes('X12', '006040');

      expect(messageTypes).toBeDefined();
      expect(Array.isArray(messageTypes)).toBe(true);
      expect(messageTypes.length).toBeGreaterThan(0);
      expect(messageTypes).toContain('850');
    });

    it('should check if 850 message exists in x12-006040', async () => {
      const exists = await repository.hasMessageStructure('X12', '006040', '850');

      expect(exists).toBe(true);
    });
  });

  describe('Version Handling', () => {
    it('should handle version with leading zeros (004010)', async () => {
      const definition = await repository.getMessageStructure('X12', '004010', '850');

      expect(definition).toBeDefined();
    });

    it('should handle version without leading zeros (4010)', async () => {
      const definition = await repository.getMessageStructure('X12', '4010', '850');

      expect(definition).toBeDefined();
    });

    it('should handle different version formats consistently (006040)', async () => {
      const def1 = await repository.getMessageStructure('X12', '006040', '850');
      const def2 = await repository.getMessageStructure('X12', '6040', '850');

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
      const definition = await repository.getMessageStructure('X12', '004010', '850');

      expect(definition?.structure).toBeDefined();
      expect(Array.isArray(definition?.structure)).toBe(true);
      expect(definition?.structure.length).toBeGreaterThan(0);
    });

    it('should have ST segment as first segment', async () => {
      const definition = await repository.getMessageStructure('X12', '004010', '850');

      const firstSegment: any = definition?.structure[0];
      expect(firstSegment?.nodeType).toBe('segment');
      expect(firstSegment?.tag).toBe('ST');
      expect(firstSegment?.mandatory).toBe(true);
    });

    it('should have SE segment as last segment', async () => {
      const definition = await repository.getMessageStructure('X12', '004010', '850');

      const lastSegment: any = definition?.structure[definition.structure.length - 1];
      expect(lastSegment?.nodeType).toBe('segment');
      expect(lastSegment?.tag).toBe('SE');
      expect(lastSegment?.mandatory).toBe(true);
    });

    it('should have BEG segment for Purchase Order', async () => {
      const definition = await repository.getMessageStructure('X12', '004010', '850');

      const begSegment: any = definition?.structure.find(
        (s: any) => s.nodeType === 'segment' && s.tag === 'BEG'
      );
      expect(begSegment).toBeDefined();
      expect(begSegment?.mandatory).toBe(true);
    });
  });
});


