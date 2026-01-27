import {beforeEach, describe, expect, it} from 'vitest';
import {BusinessObjectSchemaGenerator} from './BusinessObjectSchemaGenerator';
import {SchemaCache} from './SchemaCache';
import type {ElementNode, MessageStructure, SegmentNode} from '@domain/repositories/MessageStructure';

describe('BusinessObjectSchemaGenerator', () => {
  let generator: BusinessObjectSchemaGenerator;
  let cache: SchemaCache;

  beforeEach(() => {
    cache = new SchemaCache();
    generator = new BusinessObjectSchemaGenerator(cache);
  });

  describe('fromMessageStructure', () => {
    it('should generate JSON Schema from simple MessageStructure', () => {
      const structure: MessageStructure = {
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
                name: 'documentNumber',
                mandatory: true,
                position: 1,
                dataType: 'an',
                maxLength: 35
              } as ElementNode
            ],
            mapping: {
              targetField: 'documentNumber',
              elementIndex: 0
            }
          } as SegmentNode
        ]
      };

      const schema = generator.fromMessageStructure(structure);

      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.properties?.['documentNumber']).toEqual({
        type: 'string',
        maxLength: 35
      });
      expect(schema.required).toContain('documentNumber');
    });

    it('should cache generated schema', () => {
      const structure: MessageStructure = {
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

    it('should handle optional fields (mandatory: false)', () => {
      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'TEST',
        name: 'Test Message',
        structure: [
          {
            nodeType: 'segment',
            tag: 'TST',
            name: 'Test Segment',
            mandatory: false,
            maxOccurrences: 1,
            position: 1,
            elements: [
              {
                nodeType: 'element',
                code: '1001',
                name: 'optionalField',
                mandatory: false,
                position: 1,
                dataType: 'an'
              } as ElementNode
            ],
            mapping: {
              targetField: 'optionalField',
              elementIndex: 0
            }
          } as SegmentNode
        ]
      };

      const schema = generator.fromMessageStructure(structure);

      expect(schema.required || []).not.toContain('optionalField');
    });

    it('should map dataType "an" to string', () => {
      const elementNode: ElementNode = {
        nodeType: 'element',
        code: '1001',
        name: 'textField',
        mandatory: true,
        position: 1,
        dataType: 'an',
        maxLength: 50
      };

      const structure: MessageStructure = {
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
            elements: [elementNode],
            mapping: {
              targetField: 'textField',
              elementIndex: 0
            }
          } as SegmentNode
        ]
      };

      const schema = generator.fromMessageStructure(structure);

      expect(schema.properties?.['textField']?.type).toBe('string');
    });

    it('should map dataType "n" to number', () => {
      const elementNode: ElementNode = {
        nodeType: 'element',
        code: '1002',
        name: 'quantity',
        mandatory: true,
        position: 1,
        dataType: 'n'
      };

      const structure: MessageStructure = {
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
            elements: [elementNode],
            mapping: {
              targetField: 'quantity',
              elementIndex: 0
            }
          } as SegmentNode
        ]
      };

      const schema = generator.fromMessageStructure(structure);

      expect(schema.properties?.['quantity']?.type).toBe('number');
    });

    it('should handle array fields (maxOccurrences > 1)', () => {
      const maxLineItems = 999;
      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'TEST',
        name: 'Test Message',
        structure: [
          {
            nodeType: 'segment',
            tag: 'LIN',
            name: 'Line Item',
            mandatory: true,
            maxOccurrences: maxLineItems,
            position: 1,
            elements: [
              {
                nodeType: 'element',
                code: '1001',
                name: 'lineNumber',
                mandatory: true,
                position: 1,
                dataType: 'n'
              } as ElementNode
            ],
            mapping: {
              targetField: 'lineItems',
              elementIndex: 0,
              isArray: true
            }
          } as SegmentNode
        ]
      };

      const schema = generator.fromMessageStructure(structure);

      expect(schema.properties?.['lineItems']?.type).toBe('array');
      expect(schema.properties?.['lineItems']?.maxItems).toBe(maxLineItems);
    });
  });
});
