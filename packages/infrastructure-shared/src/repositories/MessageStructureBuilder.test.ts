import { describe, it, expect } from 'vitest';
import { MessageStructureBuilder } from './MessageStructureBuilder';
import type {
  MessageFile,
  SegmentDefinition,
  ElementDefinition,
  CompositeDefinition,
  SyntaxRule
} from './models/DataPackageModels';
import type { SegmentNode, SegmentGroupNode, ElementNode, CompositeElementNode } from '@ediflow/core';

describe('MessageStructureBuilder', () => {

  const createSegments = (): Record<string, SegmentDefinition> => ({
    BGM: {
      tag: 'BGM',
      name: 'Beginning of message',
      elements: [
        { nodeType: 'composite', compositeCode: 'C002', mandatory: false, position: 1 },
        { nodeType: 'element', elementCode: '1004', mandatory: false, position: 2 },
        { nodeType: 'element', elementCode: '1225', mandatory: false, position: 3 }
      ]
    },
    DTM: {
      tag: 'DTM',
      name: 'Date/time/period',
      elements: [
        { nodeType: 'composite', compositeCode: 'C507', mandatory: true, position: 1 }
      ]
    },
    RFF: {
      tag: 'RFF',
      name: 'Reference',
      elements: [
        { nodeType: 'composite', compositeCode: 'C506', mandatory: true, position: 1 }
      ]
    }
  });

  const createElements = (): Record<string, ElementDefinition> => ({
    '1001': { code: '1001', name: 'Document name code', dataType: 'an', maxLength: 3 },
    '1004': { code: '1004', name: 'Document identifier', dataType: 'an', maxLength: 70 },
    '1131': { code: '1131', name: 'Code list identification code', dataType: 'an', maxLength: 17 },
    '1225': { code: '1225', name: 'Message function code', dataType: 'an', maxLength: 3 },
    '2005': { code: '2005', name: 'Date or time or period function code qualifier', dataType: 'an', maxLength: 3 },
    '2380': { code: '2380', name: 'Date or time or period text', dataType: 'an', maxLength: 35 },
    '2379': { code: '2379', name: 'Date or time or period format code', dataType: 'an', maxLength: 3 },
    '3055': { code: '3055', name: 'Code list responsible agency code', dataType: 'an', maxLength: 3 },
    '1153': { code: '1153', name: 'Reference code qualifier', dataType: 'an', maxLength: 3 },
    '1154': { code: '1154', name: 'Reference identifier', dataType: 'an', maxLength: 70 },
    '1156': { code: '1156', name: 'Document line identifier', dataType: 'an', maxLength: 6 },
    '4000': { code: '4000', name: 'Reference version identifier', dataType: 'an', maxLength: 35 }
  });

  const createComposites = (): Record<string, CompositeDefinition> => ({
    C002: {
      code: 'C002',
      name: 'DOCUMENT/MESSAGE NAME',
      components: [
        { elementCode: '1001', mandatory: false, position: 1 },
        { elementCode: '1131', mandatory: false, position: 2 },
        { elementCode: '3055', mandatory: false, position: 3 }
      ]
    },
    C507: {
      code: 'C507',
      name: 'DATE/TIME/PERIOD',
      components: [
        { elementCode: '2005', mandatory: true, position: 1 },
        { elementCode: '2380', mandatory: false, position: 2 },
        { elementCode: '2379', mandatory: false, position: 3 }
      ]
    },
    C506: {
      code: 'C506',
      name: 'REFERENCE',
      components: [
        { elementCode: '1153', mandatory: true, position: 1 },
        { elementCode: '1154', mandatory: false, position: 2 },
        { elementCode: '1156', mandatory: false, position: 3 },
        { elementCode: '4000', mandatory: false, position: 4 }
      ]
    }
  });

  const createBuilder = (syntaxRules: Record<string, SyntaxRule[]> | null = null): MessageStructureBuilder =>
    new MessageStructureBuilder(createSegments(), createElements(), createComposites(), syntaxRules);

  describe('build', () => {

    it('should build MessageStructureDTO from message file with simple segments', () => {
      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'Purchase order message',
        structure: [
          { nodeType: 'segment', segmentRef: 'BGM', mandatory: true, maxOccurrences: 1, position: 10 },
          { nodeType: 'segment', segmentRef: 'DTM', mandatory: true, maxOccurrences: 35, position: 20 }
        ]
      };

      const result = createBuilder().build(messageFile);

      expect(result.standard).toBe('EDIFACT');
      expect(result.version).toBe('D.20B');
      expect(result.messageType).toBe('ORDERS');
      expect(result.name).toBe('Purchase order message');
      expect(result.structure).toHaveLength(2);
    });

    it('should resolve segmentRef to SegmentNode with tag and name', () => {
      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'Purchase order message',
        structure: [
          { nodeType: 'segment', segmentRef: 'BGM', mandatory: true, maxOccurrences: 1, position: 10 }
        ]
      };

      const result = createBuilder().build(messageFile);

      const segment = result.structure[0] as SegmentNode;
      expect(segment.nodeType).toBe('segment');
      expect(segment.tag).toBe('BGM');
      expect(segment.name).toBe('Beginning of message');
      expect(segment.mandatory).toBe(true);
      expect(segment.maxOccurrences).toBe(1);
      expect(segment.position).toBe(10);
    });

    it('should resolve element references with dataType and maxLength', () => {
      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'Purchase order message',
        structure: [
          { nodeType: 'segment', segmentRef: 'BGM', mandatory: true, maxOccurrences: 1, position: 10 }
        ]
      };

      const result = createBuilder().build(messageFile);

      const segment = result.structure[0] as SegmentNode;
      const element = segment.elements[1] as ElementNode;
      expect(element.nodeType).toBe('element');
      expect(element.code).toBe('1004');
      expect(element.name).toBe('Document identifier');
      expect(element.dataType).toBe('an');
      expect(element.mandatory).toBe(false);
      expect(element.position).toBe(2);
    });

    it('should resolve composite references with components', () => {
      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'Purchase order message',
        structure: [
          { nodeType: 'segment', segmentRef: 'BGM', mandatory: true, maxOccurrences: 1, position: 10 }
        ]
      };

      const result = createBuilder().build(messageFile);

      const segment = result.structure[0] as SegmentNode;
      const composite = segment.elements[0] as CompositeElementNode;
      expect(composite.nodeType).toBe('composite');
      expect(composite.code).toBe('C002');
      expect(composite.name).toBe('DOCUMENT/MESSAGE NAME');
      expect(composite.mandatory).toBe(false);
      expect(composite.position).toBe(1);
      expect(composite.components).toHaveLength(3);

      const firstComponent = composite.components[0]!;
      expect(firstComponent.code).toBe('1001');
      expect(firstComponent.name).toBe('Document name code');
      expect(firstComponent.dataType).toBe('an');
      expect(firstComponent.maxLength).toBe(3);
    });

    it('should resolve segment groups recursively', () => {
      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'Purchase order message',
        structure: [
          { nodeType: 'segment', segmentRef: 'BGM', mandatory: true, maxOccurrences: 1, position: 10 },
          {
            nodeType: 'segmentGroup',
            id: 'SG1', name: 'SG1', triggerSegment: 'RFF',
            mandatory: false, maxOccurrences: 10, position: 30,
            structure: [
              { nodeType: 'segment', segmentRef: 'RFF', mandatory: true, maxOccurrences: 1, position: 10 },
              { nodeType: 'segment', segmentRef: 'DTM', mandatory: false, maxOccurrences: 5, position: 20 }
            ]
          }
        ]
      };

      const result = createBuilder().build(messageFile);

      expect(result.structure).toHaveLength(2);

      const group = result.structure[1] as SegmentGroupNode;
      expect(group.nodeType).toBe('segmentGroup');
      expect(group.id).toBe('SG1');
      expect(group.triggerSegment).toBe('RFF');
      expect(group.children).toHaveLength(2);

      const rffSegment = group.children[0] as SegmentNode;
      expect(rffSegment.tag).toBe('RFF');
    });

    it('should resolve nested segment groups', () => {
      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'Purchase order message',
        structure: [
          {
            nodeType: 'segmentGroup',
            id: 'SG2', name: 'SG2', triggerSegment: 'BGM',
            mandatory: false, maxOccurrences: 99, position: 40,
            structure: [
              { nodeType: 'segment', segmentRef: 'BGM', mandatory: true, maxOccurrences: 1, position: 10 },
              {
                nodeType: 'segmentGroup',
                id: 'SG3', name: 'SG3', triggerSegment: 'RFF',
                mandatory: false, maxOccurrences: 5, position: 20,
                structure: [
                  { nodeType: 'segment', segmentRef: 'RFF', mandatory: true, maxOccurrences: 1, position: 10 }
                ]
              }
            ]
          }
        ]
      };

      const result = createBuilder().build(messageFile);

      const sg2 = result.structure[0] as SegmentGroupNode;
      const sg3 = sg2.children[1] as SegmentGroupNode;
      expect(sg3.nodeType).toBe('segmentGroup');
      expect(sg3.id).toBe('SG3');
      expect(sg3.children).toHaveLength(1);

      const rff = sg3.children[0] as SegmentNode;
      expect(rff.tag).toBe('RFF');
    });
  });

  describe('error handling', () => {

    it('should throw error for unknown segment reference', () => {
      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'Test',
        structure: [
          { nodeType: 'segment', segmentRef: 'UNKNOWN', mandatory: true, maxOccurrences: 1, position: 10 }
        ]
      };

      expect(() => createBuilder().build(messageFile)).toThrow('Segment definition not found: UNKNOWN');
    });

    it('should throw error for unknown element code in segment', () => {
      const segments: Record<string, SegmentDefinition> = {
        TST: { tag: 'TST', name: 'Test', elements: [
          { nodeType: 'element', elementCode: '9999', mandatory: true, position: 1 }
        ]}
      };

      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'TEST', name: 'Test',
        structure: [{ nodeType: 'segment', segmentRef: 'TST', mandatory: true, maxOccurrences: 1, position: 10 }]
      };

      expect(() => new MessageStructureBuilder(segments, createElements(), createComposites(), null).build(messageFile))
        .toThrow('Element definition not found: 9999');
    });

    it('should throw error for unknown composite code in segment', () => {
      const segments: Record<string, SegmentDefinition> = {
        TST: { tag: 'TST', name: 'Test', elements: [
          { nodeType: 'composite', compositeCode: 'C999', mandatory: true, position: 1 }
        ]}
      };

      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'TEST', name: 'Test',
        structure: [{ nodeType: 'segment', segmentRef: 'TST', mandatory: true, maxOccurrences: 1, position: 10 }]
      };

      expect(() => new MessageStructureBuilder(segments, createElements(), createComposites(), null).build(messageFile))
        .toThrow('Composite definition not found: C999');
    });
  });

  describe('syntax rules', () => {

    it('should attach syntax rules to resolved segments when available', () => {
      const syntaxRules: Record<string, SyntaxRule[]> = {
        BGM: [{ type: 'C', positions: [1, 2], description: 'If 01 is present, then 02 is required.' }]
      };

      const messageFile: MessageFile = {
        standard: 'X12', version: '004010', messageType: '850', name: 'Purchase Order',
        structure: [{ nodeType: 'segment', segmentRef: 'BGM', mandatory: true, maxOccurrences: 1, position: 10 }]
      };

      const segment = createBuilder(syntaxRules).build(messageFile).structure[0] as SegmentNode;
      expect(segment.syntaxRules).toHaveLength(1);
      expect(segment.syntaxRules![0]!.type).toBe('C');
    });

    it('should not attach syntax rules when none exist for segment', () => {
      const syntaxRules: Record<string, SyntaxRule[]> = {
        OTHER: [{ type: 'P', positions: [1, 2], description: 'Paired.' }]
      };

      const messageFile: MessageFile = {
        standard: 'X12', version: '004010', messageType: '850', name: 'Purchase Order',
        structure: [{ nodeType: 'segment', segmentRef: 'BGM', mandatory: true, maxOccurrences: 1, position: 10 }]
      };

      const segment = createBuilder(syntaxRules).build(messageFile).structure[0] as SegmentNode;
      expect(segment.syntaxRules).toBeUndefined();
    });

    it('should work without syntax rules (null)', () => {
      const messageFile: MessageFile = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'Purchase order message',
        structure: [{ nodeType: 'segment', segmentRef: 'BGM', mandatory: true, maxOccurrences: 1, position: 10 }]
      };

      const segment = createBuilder(null).build(messageFile).structure[0] as SegmentNode;
      expect(segment.syntaxRules).toBeUndefined();
    });
  });

  describe('element codeListCode', () => {

    it('should include codeListCode when element has one', () => {
      const elements: Record<string, ElementDefinition> = {
        ...createElements(),
        '128': { code: '128', name: 'Reference Identification Qualifier', dataType: 'id', maxLength: 3, codeListCode: '128' }
      };
      const segments: Record<string, SegmentDefinition> = {
        REF: { tag: 'REF', name: 'Reference', elements: [
          { nodeType: 'element', elementCode: '128', mandatory: true, position: 1 }
        ]}
      };

      const messageFile: MessageFile = {
        standard: 'X12', version: '004010', messageType: '850', name: 'Purchase Order',
        structure: [{ nodeType: 'segment', segmentRef: 'REF', mandatory: false, maxOccurrences: 1, position: 10 }]
      };

      const result = new MessageStructureBuilder(segments, elements, createComposites(), null).build(messageFile);
      const element = (result.structure[0] as SegmentNode).elements[0] as ElementNode;

      expect(element.codeListCode).toBe('128');
    });
  });
});

