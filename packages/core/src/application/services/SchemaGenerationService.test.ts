import {beforeEach, describe, expect, it} from 'vitest';
import { SchemaGenerationService} from '@application';
import {SchemaCache} from '@application';
import type {ElementNode, MessageStructureDTO, SegmentNode} from '@application/dtos';

describe('SchemaGenerationService', () => {
  let generator: SchemaGenerationService;
  let cache: SchemaCache;

  beforeEach(() => {
    cache = new SchemaCache();
    generator = new SchemaGenerationService(cache);
  });

  describe('fromMessageStructure', () => {
    it('should generate JSON Schema with segment tag as property key', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'TEST',
        name: 'Test Message',
        structure: [
          {
            nodeType: 'segment',
            tag: 'BGM',
            name: 'Beginning of message',
            mandatory: true,
            maxOccurrences: 1,
            position: 1,
            elements: [
              {
                nodeType: 'element',
                code: '1004',
                name: 'Document identifier',
                mandatory: true,
                position: 1,
                dataType: 'an',
                maxLength: 35
              } as ElementNode
            ]
          } as SegmentNode
        ]
      };

      const schema = generator.fromMessageStructure(structure);

      expect(schema.type).toBe('object');
      expect(schema.title).toBe('Test Message');
      expect(schema.properties).toBeDefined();
      // Property keyed by segment tag
      expect(schema.properties?.['BGM']).toBeDefined();
      // Element property keyed by element code
      const elem = schema.properties?.['BGM']?.properties?.['1004'];
      expect(elem?.type).toBe('string');
      expect(elem?.title).toBe('Document identifier');
      expect(elem?.maxLength).toBe(35);
      expect(elem?.['x-position']).toBe(1);
      expect(elem?.['x-mandatory']).toBe(true);
      expect(elem?.['x-nodeType']).toBe('element');
      // Segment extension fields
      const bgm = schema.properties?.['BGM'];
      expect(bgm?.['x-position']).toBe(1);
      expect(bgm?.['x-mandatory']).toBe(true);
      expect(bgm?.['x-nodeType']).toBe('segment');
      expect(schema.required).toContain('BGM');
    });

    it('should cache generated schema', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'TEST',
        name: 'Test Message',
        structure: []
      };

      const firstCall = generator.fromMessageStructure(structure);
      const secondCall = generator.fromMessageStructure(structure);

      expect(firstCall).toBe(secondCall); // Same instance = cached
    });

    it('should not add segment to required when mandatory false', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'TEST',
        name: 'Test Message',
        structure: [
          {
            nodeType: 'segment',
            tag: 'FTX',
            name: 'Free text',
            mandatory: false,
            maxOccurrences: 1,
            position: 1,
            elements: [
              {
                nodeType: 'element',
                code: '4451',
                name: 'Text subject code qualifier',
                mandatory: false,
                position: 1,
                dataType: 'an'
              } as ElementNode
            ]
          } as SegmentNode
        ]
      };

      const schema = generator.fromMessageStructure(structure);

      expect(schema.required || []).not.toContain('FTX');
    });

    it('should map dataType "an" to string on element level', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'TEST',
        name: 'Test Message',
        structure: [
          {
            nodeType: 'segment',
            tag: 'TST',
            name: 'Test Segment',
            mandatory: true,
            maxOccurrences: 1,
            position: 1,
            elements: [
              {
                nodeType: 'element',
                code: '1001',
                name: 'textField',
                mandatory: true,
                position: 1,
                dataType: 'an',
                maxLength: 50
              } as ElementNode
            ]
          } as SegmentNode
        ]
      };

      const schema = generator.fromMessageStructure(structure);

      expect(schema.properties?.['TST']?.properties?.['1001']?.type).toBe('string');
    });

    it('should map dataType "n" to number on element level', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'TEST',
        name: 'Test Message',
        structure: [
          {
            nodeType: 'segment',
            tag: 'QTY',
            name: 'Quantity',
            mandatory: true,
            maxOccurrences: 1,
            position: 1,
            elements: [
              {
                nodeType: 'element',
                code: '6060',
                name: 'Quantity',
                mandatory: true,
                position: 1,
                dataType: 'n'
              } as ElementNode
            ]
          } as SegmentNode
        ]
      };

      const schema = generator.fromMessageStructure(structure);

      expect(schema.properties?.['QTY']?.properties?.['6060']?.type).toBe('number');
    });

    it('should generate array schema for repeating segment (maxOccurrences > 1)', () => {
      const maxOccurrences = 999;
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'TEST',
        name: 'Test Message',
        structure: [
          {
            nodeType: 'segment',
            tag: 'LIN',
            name: 'Line item',
            mandatory: true,
            maxOccurrences,
            position: 1,
            elements: [
              {
                nodeType: 'element',
                code: '1082',
                name: 'Line item identifier',
                mandatory: true,
                position: 1,
                dataType: 'n'
              } as ElementNode
            ]
          } as SegmentNode
        ]
      };

      const schema = generator.fromMessageStructure(structure);

      expect(schema.properties?.['LIN']?.type).toBe('array');
      expect(schema.properties?.['LIN']?.maxItems).toBe(maxOccurrences);
      expect(schema.properties?.['LIN']?.items).toBeDefined();
    });
  });
});
