import { describe, it, expect, beforeEach } from 'vitest';
import { SegmentOrGroup } from '@ediflow/core';
import * as path from 'path';
import {FileBasedMessageStructureRepository} from "@ediflow/infrastructure-shared";
describe('FileBasedMessageStructureRepository Integration', () => {

  const basePath = path.resolve(__dirname, '../../../../');
  let repository: FileBasedMessageStructureRepository;

  beforeEach(() => {
    repository = new FileBasedMessageStructureRepository(basePath);
  });

  describe('getMessageDefinition', () => {
    it('should load ORDERS message definition from JSON file', async () => {
      const definition = await repository.getMessageDefinition('EDIFACT', 'D.20B', 'ORDERS');

      expect(definition).not.toBeNull();
      expect(definition?.standard).toBe('EDIFACT');
      expect(definition?.version).toBe('D.20B');
      expect(definition?.messageType).toBe('ORDERS');
      expect(definition?.name).toBe('ORDERS'); // Message name extraction to be improved
      expect(definition?.structure).toBeDefined();
      expect(definition?.structure.length).toBeGreaterThan(0);
    });

    it('should handle case-insensitive standard and version', async () => {
      const definition = await repository.getMessageDefinition('edifact', 'd.20b', 'ORDERS');

      expect(definition).not.toBeNull();
      expect(definition?.messageType).toBe('ORDERS');
    });

    it('should return null for non-existing message', async () => {
      const definition = await repository.getMessageDefinition('EDIFACT', 'D.20B', 'NONEXIST');

      expect(definition).toBeNull();
    });

    it('should validate message structure contains segment references', async () => {
      const definition = await repository.getMessageDefinition('EDIFACT', 'D.20B', 'ORDERS');

      const unhSegment = definition?.structure.find(
        (node: SegmentOrGroup) => node.nodeType === 'segment' && 'segmentRef' in node && node.segmentRef === 'UNH'
      );

      expect(unhSegment).toBeDefined();
      expect(unhSegment?.nodeType).toBe('segment');
      if (unhSegment && 'segmentRef' in unhSegment) {
        expect(unhSegment.segmentRef).toBe('UNH');
        expect(unhSegment.mandatory).toBe(true);
      }
    });

    it('should validate message structure contains segment groups', async () => {
      const definition = await repository.getMessageDefinition('EDIFACT', 'D.20B', 'ORDERS');

      const segmentGroup = definition?.structure.find(
        (node: SegmentOrGroup) => node.nodeType === 'segmentGroup' && 'id' in node && node.id === 'SG2'
      );

      expect(segmentGroup).toBeDefined();
      expect(segmentGroup?.nodeType).toBe('segmentGroup');
      if (segmentGroup && 'id' in segmentGroup) {
        expect(segmentGroup.id).toBe('SG2');
        expect(segmentGroup.name).toBe('Segment group 2');
        expect(segmentGroup.children).toBeDefined();
        // Note: Detailed segment group children parsing is future enhancement
        // For now, children array exists but may be empty (flat structure)
      }
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

  describe('hasMessageDefinition', () => {
    it('should return true for existing message', async () => {
      const exists = await repository.hasMessageDefinition('EDIFACT', 'D.20B', 'ORDERS');

      expect(exists).toBe(true);
    });

    it('should return false for non-existing message', async () => {
      const exists = await repository.hasMessageDefinition('EDIFACT', 'D.20B', 'NONEXIST');

      expect(exists).toBe(false);
    });
  });
});
