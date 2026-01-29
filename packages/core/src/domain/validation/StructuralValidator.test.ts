import { describe, it, expect, beforeEach } from 'vitest';
import { StructuralValidator } from './StructuralValidator';
import { EDIMessage } from '@domain/entities/EDIMessage';
import { EDISegment } from '@domain/entities/EDISegment';
import { Standard } from '@domain/value-objects/Standard';
import { Version } from '@domain/value-objects/Version';
import { MessageType } from '@domain/value-objects/MessageType';
import { MessageStructure, SegmentNode, SegmentGroupNode } from '@domain/repositories/MessageStructure';

describe('StructuralValidator', () => {
  let validator: StructuralValidator;

  beforeEach(() => {
    validator = new StructuralValidator();
  });

  const createMessage = (segments: EDISegment[]): EDIMessage => {
    const message = new EDIMessage(
      Standard.EDIFACT,
      new Version(Standard.EDIFACT, 'D.20B'),
      new MessageType(Standard.EDIFACT, 'ORDERS')
    );
    segments.forEach(s => message.addSegment(s));
    return message;
  };

  describe('validate() - Mandatory Segments', () => {
    it('should pass when mandatory segment is present', () => {
      const structure: MessageStructure = {
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
      const structure: MessageStructure = {
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
      const structure: MessageStructure = {
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
      const structure: MessageStructure = {
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
      const structure: MessageStructure = {
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
      const structure: MessageStructure = {
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
      const structure: MessageStructure = {
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
      const structure: MessageStructure = {
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
      const structure: MessageStructure = {
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
      expect(result.errors.some(e => e.field === 'SG2.SG3')).toBe(true);
      expect(result.errors.some(e => e.field === 'SG2.SG3.CTA[0]')).toBe(true);
    });
  });

  describe('validate() - Complex Scenarios', () => {
    it('should validate multiple segments and groups', () => {
      const structure: MessageStructure = {
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
      const structure: MessageStructure = {
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

