import { describe, it, expect, beforeEach } from 'vitest';
import { StructuralValidationService } from './StructuralValidationService';
import { EDIMessage } from '@domain/entities/EDIMessage';
import { EDISegment } from '@domain/value-objects/EDISegment';
import { EDIElement } from '@domain/value-objects/EDIElement';
import { Standard } from '@domain/value-objects/Standard';
import { Version } from '@domain/value-objects/Version';
import { MessageType } from '@domain/value-objects/MessageType';
import type { MessageStructureDTO, SegmentNode, SegmentGroupNode } from '@application/dtos';

describe('StructuralValidationService', () => {
  let validator: StructuralValidationService;

  beforeEach(() => {
    validator = new StructuralValidationService();
  });

  const createMessage = (segments: EDISegment[]): EDIMessage => {
    const message = new EDIMessage(
      'test-id',
      Standard.EDIFACT,
      new Version(Standard.EDIFACT, 'D.20B'),
      new MessageType(Standard.EDIFACT, 'ORDERS')
    );
    segments.forEach(s => message.addSegment(s));
    return message;
  };

  describe('validate() - Mandatory Segments', () => {
    it('should pass when mandatory segment is present', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segment',
            tag: 'UNH',
            name: 'Message header',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: []
          } as SegmentNode
        ]
      };

      const message = createMessage([
        new EDISegment('UNH', [])
      ]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when mandatory segment is missing', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segment',
            tag: 'UNH',
            name: 'Message header',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: []
          } as SegmentNode
        ]
      };

      const message = createMessage([]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('UNH[0]');
      expect(result.errors[0]?.code).toBe('MISSING_MANDATORY_SEGMENT');
      expect(result.errors[0]?.message).toContain('Mandatory segment UNH is missing');
    });

    it('should pass when optional segment is missing', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segment',
            tag: 'FTX',
            name: 'Free text',
            mandatory: false,
            maxOccurrences: 99,
            position: 20,
            elements: []
          } as SegmentNode
        ]
      };

      const message = createMessage([]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validate() - Max Occurrences', () => {
    it('should pass when segment occurrences are within limit', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segment',
            tag: 'LIN',
            name: 'Line item',
            mandatory: false,
            maxOccurrences: 3,
            position: 30,
            elements: []
          } as SegmentNode
        ]
      };

      const message = createMessage([
        new EDISegment('LIN', []),
        new EDISegment('LIN', []),
        new EDISegment('LIN', [])
      ]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when segment exceeds max occurrences', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segment',
            tag: 'LIN',
            name: 'Line item',
            mandatory: false,
            maxOccurrences: 2,
            position: 30,
            elements: []
          } as SegmentNode
        ]
      };

      const message = createMessage([
        new EDISegment('LIN', []),
        new EDISegment('LIN', []),
        new EDISegment('LIN', [])
      ]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('LIN[0]');
      expect(result.errors[0]?.code).toBe('MAX_OCCURRENCES_EXCEEDED');
      expect(result.errors[0]?.message).toContain('3 times');
      expect(result.errors[0]?.message).toContain('max: 2');
    });
  });

  describe('validate() - Segment Groups', () => {
    it('should pass when mandatory group is present', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segmentGroup',
            id: 'SG2',
            name: 'Party details',
            mandatory: true,
            maxOccurrences: 1,
            position: 20,
            triggerSegment: 'NAD',
            children: [
              {
                nodeType: 'segment',
                tag: 'NAD',
                name: 'Name and address',
                mandatory: true,
                maxOccurrences: 1,
                position: 10,
                elements: []
              } as SegmentNode
            ]
          } as SegmentGroupNode
        ]
      };

      const message = createMessage([
        new EDISegment('NAD', [])
      ]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when mandatory group is missing', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segmentGroup',
            id: 'SG2',
            name: 'Party details',
            mandatory: true,
            maxOccurrences: 1,
            position: 20,
            triggerSegment: 'NAD',
            children: [
              {
                nodeType: 'segment',
                tag: 'NAD',
                name: 'Name and address',
                mandatory: true,
                maxOccurrences: 1,
                position: 10,
                elements: []
              } as SegmentNode
            ]
          } as SegmentGroupNode
        ]
      };

      const message = createMessage([]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]?.field).toBe('SG2');
      expect(result.errors[0]?.code).toBe('MISSING_MANDATORY_GROUP');
    });

    it('should fail when group exceeds max occurrences', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segmentGroup',
            id: 'SG2',
            name: 'Party details',
            mandatory: false,
            maxOccurrences: 2,
            position: 20,
            triggerSegment: 'NAD',
            children: [
              {
                nodeType: 'segment',
                tag: 'NAD',
                name: 'Name and address',
                mandatory: true,
                maxOccurrences: 1,
                position: 10,
                elements: []
              } as SegmentNode
            ]
          } as SegmentGroupNode
        ]
      };

      const message = createMessage([
        new EDISegment('NAD', []),
        new EDISegment('NAD', []),
        new EDISegment('NAD', [])
      ]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('SG2');
      expect(result.errors[0]?.code).toBe('MAX_GROUP_OCCURRENCES_EXCEEDED');
      expect(result.errors[0]?.message).toContain('3 times');
      expect(result.errors[0]?.message).toContain('max: 2');
    });

    it('should validate nested segment groups', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segmentGroup',
            id: 'SG2',
            name: 'Party details',
            mandatory: true,
            maxOccurrences: 1,
            position: 20,
            triggerSegment: 'NAD',
            children: [
              {
                nodeType: 'segment',
                tag: 'NAD',
                name: 'Name and address',
                mandatory: true,
                maxOccurrences: 1,
                position: 10,
                elements: []
              } as SegmentNode,
              {
                nodeType: 'segmentGroup',
                id: 'SG3',
                name: 'Contact',
                mandatory: true,
                maxOccurrences: 1,
                position: 30,
                triggerSegment: 'CTA',
                children: [
                  {
                    nodeType: 'segment',
                    tag: 'CTA',
                    name: 'Contact information',
                    mandatory: true,
                    maxOccurrences: 1,
                    position: 10,
                    elements: []
                  } as SegmentNode
                ]
              } as SegmentGroupNode
            ]
          } as SegmentGroupNode
        ]
      };

      const message = createMessage([
        new EDISegment('NAD', [])
      ]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'SG2.SG3')).toBe(true);
      expect(result.errors.some((e) => e.field === 'SG2.SG3.CTA[0]')).toBe(true);
    });
  });

  describe('validate() - Element-Level', () => {
    it('should fail when mandatory element is missing (empty string)', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'PO',
        structure: [{
          nodeType: 'segment', tag: 'BGM', name: 'Beginning', mandatory: true, maxOccurrences: 1, position: 10,
          elements: [
            { nodeType: 'element', code: '1004', name: 'Document number', mandatory: true, position: 1, maxLength: 35 }
          ]
        } as SegmentNode]
      };
      const message = createMessage([new EDISegment('BGM', [])]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_MANDATORY_ELEMENT')).toBe(true);
      expect(result.errors.some(e => e.field === 'BGM[0].1004[1]')).toBe(true);
    });

    it('should pass when mandatory element is present', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'PO',
        structure: [{
          nodeType: 'segment', tag: 'BGM', name: 'Beginning', mandatory: true, maxOccurrences: 1, position: 10,
          elements: [
            { nodeType: 'element', code: '1004', name: 'Document number', mandatory: true, position: 1, maxLength: 35 }
          ]
        } as SegmentNode]
      };
      const message = createMessage([new EDISegment('BGM', [new EDIElement('ORD123')])]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(true);
    });

    it('should fail when element exceeds maxLength', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'PO',
        structure: [{
          nodeType: 'segment', tag: 'BGM', name: 'Beginning', mandatory: true, maxOccurrences: 1, position: 10,
          elements: [
            { nodeType: 'element', code: '1004', name: 'Document number', mandatory: false, position: 1, maxLength: 5 }
          ]
        } as SegmentNode]
      };
      const message = createMessage([new EDISegment('BGM', [new EDIElement('TOOLONG123')])]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'ELEMENT_TOO_LONG')).toBe(true);
      expect(result.errors.some(e => e.field === 'BGM[0].1004[1]')).toBe(true);
    });

    it('should pass when element is within maxLength', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'PO',
        structure: [{
          nodeType: 'segment', tag: 'BGM', name: 'Beginning', mandatory: true, maxOccurrences: 1, position: 10,
          elements: [
            { nodeType: 'element', code: '1004', name: 'Document number', mandatory: false, position: 1, maxLength: 35 }
          ]
        } as SegmentNode]
      };
      const message = createMessage([new EDISegment('BGM', [new EDIElement('ORD123')])]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(true);
    });

    it('should skip element validation when no elements defined in structure', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'PO',
        structure: [{
          nodeType: 'segment', tag: 'UNH', name: 'Header', mandatory: true, maxOccurrences: 1, position: 10,
          elements: []
        } as SegmentNode]
      };
      const message = createMessage([new EDISegment('UNH', [new EDIElement('1'), new EDIElement('ORDERS')])]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validate() - SyntaxRules (P/R/E/C/L)', () => {
    it('should fail P-rule: if one element in group is present, all must be present', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'PO',
        structure: [{
          nodeType: 'segment', tag: 'DTM', name: 'Date', mandatory: false, maxOccurrences: 1, position: 10,
          elements: [
            { nodeType: 'element', code: '2005', name: 'Function', mandatory: false, position: 1, maxLength: 3 },
            { nodeType: 'element', code: '2380', name: 'Value', mandatory: false, position: 2, maxLength: 35 },
            { nodeType: 'element', code: '2379', name: 'Format', mandatory: false, position: 3, maxLength: 3 }
          ],
          syntaxRules: [{ type: 'P', positions: [1, 2, 3], description: 'If 2005 present, 2380 and 2379 must be present' }]
        } as SegmentNode]
      };
      const message = createMessage([new EDISegment('DTM', [new EDIElement('137')])]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'SYNTAX_RULE_P_VIOLATION')).toBe(true);
    });

    it('should pass P-rule: all elements in group are present', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'PO',
        structure: [{
          nodeType: 'segment', tag: 'DTM', name: 'Date', mandatory: false, maxOccurrences: 1, position: 10,
          elements: [
            { nodeType: 'element', code: '2005', name: 'Function', mandatory: false, position: 1, maxLength: 3 },
            { nodeType: 'element', code: '2380', name: 'Value', mandatory: false, position: 2, maxLength: 35 },
            { nodeType: 'element', code: '2379', name: 'Format', mandatory: false, position: 3, maxLength: 3 }
          ],
          syntaxRules: [{ type: 'P', positions: [1, 2, 3], description: 'All or nothing' }]
        } as SegmentNode]
      };
      const message = createMessage([new EDISegment('DTM', [new EDIElement('137'), new EDIElement('20240101'), new EDIElement('102')])]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(true);
    });

    it('should fail R-rule: at least one element in group must be present', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'PO',
        structure: [{
          nodeType: 'segment', tag: 'NAD', name: 'Name', mandatory: false, maxOccurrences: 1, position: 10,
          elements: [
            { nodeType: 'element', code: '3035', name: 'Role', mandatory: false, position: 1, maxLength: 3 },
            { nodeType: 'element', code: '3039', name: 'ID', mandatory: false, position: 2, maxLength: 35 },
            { nodeType: 'element', code: '3164', name: 'City', mandatory: false, position: 3, maxLength: 35 }
          ],
          syntaxRules: [{ type: 'R', positions: [2, 3], description: 'ID or City required' }]
        } as SegmentNode]
      };
      const message = createMessage([new EDISegment('NAD', [new EDIElement('BY')])]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'SYNTAX_RULE_R_VIOLATION')).toBe(true);
    });

    it('should fail E-rule: only one element in the exclusive group may be present', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'PO',
        structure: [{
          nodeType: 'segment', tag: 'RFF', name: 'Reference', mandatory: false, maxOccurrences: 1, position: 10,
          elements: [
            { nodeType: 'element', code: '1153', name: 'Qualifier', mandatory: false, position: 1, maxLength: 3 },
            { nodeType: 'element', code: '1154', name: 'Number', mandatory: false, position: 2, maxLength: 35 }
          ],
          syntaxRules: [{ type: 'E', positions: [1, 2], description: 'Exclusive: only one of Qualifier or Number' }]
        } as SegmentNode]
      };
      const message = createMessage([new EDISegment('RFF', [new EDIElement('PO'), new EDIElement('123')])]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'SYNTAX_RULE_E_VIOLATION')).toBe(true);
    });

    it('should fail C-rule: if first element present, second must be present', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'PO',
        structure: [{
          nodeType: 'segment', tag: 'CTA', name: 'Contact', mandatory: false, maxOccurrences: 1, position: 10,
          elements: [
            { nodeType: 'element', code: '3139', name: 'Function', mandatory: false, position: 1, maxLength: 3 },
            { nodeType: 'element', code: '3413', name: 'Name', mandatory: false, position: 2, maxLength: 35 }
          ],
          syntaxRules: [{ type: 'C', positions: [1, 2], description: 'If Function present, Name required' }]
        } as SegmentNode]
      };
      const message = createMessage([new EDISegment('CTA', [new EDIElement('IC')])]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'SYNTAX_RULE_C_VIOLATION')).toBe(true);
    });

    it('should fail L-rule: if last element present, first must be present', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT', version: 'D.20B', messageType: 'ORDERS', name: 'PO',
        structure: [{
          nodeType: 'segment', tag: 'CTA', name: 'Contact', mandatory: false, maxOccurrences: 1, position: 10,
          elements: [
            { nodeType: 'element', code: '3139', name: 'Function', mandatory: false, position: 1, maxLength: 3 },
            { nodeType: 'element', code: '3413', name: 'Name', mandatory: false, position: 2, maxLength: 35 }
          ],
          syntaxRules: [{ type: 'L', positions: [1, 2], description: 'If Name present, Function required' }]
        } as SegmentNode]
      };
      const message = createMessage([new EDISegment('CTA', [new EDIElement(''), new EDIElement('John')])]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'SYNTAX_RULE_L_VIOLATION')).toBe(true);
    });
  });

  describe('validate() - Complex Scenarios', () => {
    it('should validate multiple segments and groups', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segment',
            tag: 'UNH',
            name: 'Message header',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: []
          } as SegmentNode,
          {
            nodeType: 'segment',
            tag: 'BGM',
            name: 'Beginning of message',
            mandatory: true,
            maxOccurrences: 1,
            position: 20,
            elements: []
          } as SegmentNode,
          {
            nodeType: 'segmentGroup',
            id: 'SG2',
            name: 'Party details',
            mandatory: true,
            maxOccurrences: 99,
            position: 30,
            triggerSegment: 'NAD',
            children: [
              {
                nodeType: 'segment',
                tag: 'NAD',
                name: 'Name and address',
                mandatory: true,
                maxOccurrences: 1,
                position: 10,
                elements: []
              } as SegmentNode
            ]
          } as SegmentGroupNode,
          {
            nodeType: 'segment',
            tag: 'UNT',
            name: 'Message trailer',
            mandatory: true,
            maxOccurrences: 1,
            position: 40,
            elements: []
          } as SegmentNode
        ]
      };

      const message = createMessage([
        new EDISegment('UNH', []),
        new EDISegment('BGM', []),
        new EDISegment('NAD', []),
        new EDISegment('UNT', [])
      ]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect all validation errors', () => {
      const structure: MessageStructureDTO = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segment',
            tag: 'UNH',
            name: 'Message header',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: []
          } as SegmentNode,
          {
            nodeType: 'segment',
            tag: 'BGM',
            name: 'Beginning of message',
            mandatory: true,
            maxOccurrences: 1,
            position: 20,
            elements: []
          } as SegmentNode,
          {
            nodeType: 'segment',
            tag: 'DTM',
            name: 'Date/time',
            mandatory: false,
            maxOccurrences: 2,
            position: 30,
            elements: []
          } as SegmentNode
        ]
      };

      const message = createMessage([
        new EDISegment('DTM', []),
        new EDISegment('DTM', []),
        new EDISegment('DTM', [])
      ]);

      const result = validator.validate(message, structure);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
      expect(result.errors.some(e => e.code === 'MISSING_MANDATORY_SEGMENT' && e.field === 'UNH[0]')).toBe(true);
      expect(result.errors.some(e => e.code === 'MISSING_MANDATORY_SEGMENT' && e.field === 'BGM[0]')).toBe(true);
      expect(result.errors.some(e => e.code === 'MAX_OCCURRENCES_EXCEEDED' && e.field === 'DTM[0]')).toBe(true);
    });
  });
});

