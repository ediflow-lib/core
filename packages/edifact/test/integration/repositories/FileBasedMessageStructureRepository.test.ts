import { describe, it, expect, beforeEach } from 'vitest';
import * as path from 'path';
import {FileBasedMessageStructureRepository} from "@ediflow/infrastructure-shared";
describe('FileBasedMessageStructureRepository Integration', () => {

  const basePath = path.resolve(__dirname, '../../../../');
  let repository: FileBasedMessageStructureRepository;

  beforeEach(() => {
    repository = new FileBasedMessageStructureRepository(basePath);
  });

  describe('getMessageStructure', () => {
    it('should load ORDERS message definition from JSON file', async () => {
      const definition = await repository.getMessageStructure('EDIFACT', 'D.20B', 'ORDERS');

      expect(definition).not.toBeNull();
      expect(definition?.standard).toBe('EDIFACT');
      expect(definition?.version).toBe('D.20B');
      expect(definition?.messageType).toBe('ORDERS');
      expect(definition?.name).toBe('Purchase order message'); // Message name extraction to be improved
      expect(definition?.structure).toBeDefined();
      expect(definition?.structure.length).toBeGreaterThan(0);
    });

    it('should handle case-insensitive standard and version', async () => {
      const definition = await repository.getMessageStructure('edifact', 'd.20b', 'ORDERS');

      expect(definition).not.toBeNull();
      expect(definition?.messageType).toBe('ORDERS');
    });

    it('should return null for non-existing message', async () => {
      const definition = await repository.getMessageStructure('EDIFACT', 'D.20B', 'NONEXIST');

      expect(definition).toBeNull();
    });

    it('should validate message structure contains segment references', async () => {
      const definition = await repository.getMessageStructure('EDIFACT', 'D.20B', 'ORDERS');

      const unhSegment: any = definition?.structure.find(
        (node: any) => node.nodeType === 'segment' && node.segmentRef === 'UNH'
      );

      expect(unhSegment).toBeDefined();
      expect(unhSegment?.nodeType).toBe('segment');
      expect(unhSegment?.segmentRef).toBe('UNH');
      expect(unhSegment?.mandatory).toBe(true);
    });

    it('should validate message structure contains segment groups', async () => {
      const definition = await repository.getMessageStructure('EDIFACT', 'D.20B', 'ORDERS');

      const segmentGroup: any = definition?.structure.find(
        (node: any) => node.nodeType === 'segmentGroup' && node.id === 'SG2'
      );

      expect(segmentGroup).toBeDefined();
      expect(segmentGroup?.nodeType).toBe('segmentGroup');
      expect(segmentGroup?.id).toBe('SG2');
      expect(segmentGroup?.name).toBe('SG2');
      expect(segmentGroup?.structure).toBeDefined();
      expect(Array.isArray(segmentGroup?.structure)).toBe(true);
    });
  });

  describe('getAllMessageTypes', () => {
    it('should return list of available message types', async () => {
      const messageTypes = await repository.getAllMessageTypes('EDIFACT', 'D.20B');

      expect(messageTypes).toContain('ORDERS');
      expect(messageTypes.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existing directory', async () => {
      const messageTypes = await repository.getAllMessageTypes('X12', '5010');

      expect(messageTypes).toEqual([]);
    });
  });

  describe('hasMessageStructure', () => {
    it('should return true for existing message', async () => {
      const exists = await repository.hasMessageStructure('EDIFACT', 'D.20B', 'ORDERS');

      expect(exists).toBe(true);
    });

    it('should return false for non-existing message', async () => {
      const exists = await repository.hasMessageStructure('EDIFACT', 'D.20B', 'NONEXIST');

      expect(exists).toBe(false);
    });
  });
});
