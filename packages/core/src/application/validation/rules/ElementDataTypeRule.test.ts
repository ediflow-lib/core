import { describe, it, expect } from 'vitest';
import { ElementDataTypeRule } from '@application';
import { EDIMessage, Standard, Version, MessageType, EDISegment, EDIElement } from '@domain';
import type { MessageStructureDTO, SegmentNode } from '@application/dtos';

const createStructureWithElement = (dataType: string): MessageStructureDTO => ({
  standard: 'X12', version: '004010', messageType: '850', name: 'PO',
  structure: [{
    nodeType: 'segment', tag: 'BEG', name: 'Beginning', mandatory: true, maxOccurrences: 1, position: 10,
    elements: [
      { nodeType: 'element', code: '353', name: 'TransactionSetPurposeCode', mandatory: true, position: 1, dataType }
    ]
  } as SegmentNode]
});

const createMessage = (value: string): EDIMessage => {
  const message = new EDIMessage('id', Standard.X12, new Version(Standard.X12, '004010'), new MessageType(Standard.X12, '850'));
  message.addSegment(new EDISegment('BEG', [new EDIElement(value)]));
  return message;
};

describe('ElementDataTypeRule', () => {
  describe('dataType: n (numeric)', () => {
    it('should pass for valid numeric value', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('n'));
      expect(rule.apply(createMessage('12345'))).toHaveLength(0);
    });

    it('should fail for alphabetic value', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('n'));
      const errors = rule.apply(createMessage('ABC'));
      expect(errors).toHaveLength(1);
      expect(errors[0]!.code).toBe('INVALID_DATA_TYPE');
    });

    it('should pass for decimal number', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('n'));
      expect(rule.apply(createMessage('12.5'))).toHaveLength(0);
    });

    it('should pass for empty value (not mandatory validation here)', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('n'));
      expect(rule.apply(createMessage(''))).toHaveLength(0);
    });
  });

  describe('dataType: a (alphabetic)', () => {
    it('should pass for alphabetic value', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('a'));
      expect(rule.apply(createMessage('ABC'))).toHaveLength(0);
    });

    it('should fail for numeric value', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('a'));
      const errors = rule.apply(createMessage('123'));
      expect(errors).toHaveLength(1);
      expect(errors[0]!.code).toBe('INVALID_DATA_TYPE');
    });
  });

  describe('dataType: an (alphanumeric)', () => {
    it('should pass for any string', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('an'));
      expect(rule.apply(createMessage('ABC123'))).toHaveLength(0);
    });

    it('should pass for special chars', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('an'));
      expect(rule.apply(createMessage('ABC-123/X'))).toHaveLength(0);
    });
  });

  describe('dataType: id (identifier)', () => {
    it('should pass for any non-empty string (code validation is separate)', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('id'));
      expect(rule.apply(createMessage('00'))).toHaveLength(0);
    });
  });

  describe('dataType: dt (date)', () => {
    it('should pass for 8-digit date YYYYMMDD', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('dt'));
      expect(rule.apply(createMessage('20240101'))).toHaveLength(0);
    });

    it('should pass for 6-digit date YYMMDD', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('dt'));
      expect(rule.apply(createMessage('240101'))).toHaveLength(0);
    });

    it('should fail for non-numeric date', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('dt'));
      const errors = rule.apply(createMessage('2024-01-01'));
      expect(errors).toHaveLength(1);
      expect(errors[0]!.code).toBe('INVALID_DATE_FORMAT');
    });

    it('should fail for wrong length', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('dt'));
      const errors = rule.apply(createMessage('2024'));
      expect(errors).toHaveLength(1);
      expect(errors[0]!.code).toBe('INVALID_DATE_FORMAT');
    });
  });

  describe('dataType: tm (time)', () => {
    it('should pass for 4-digit time HHMM', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('tm'));
      expect(rule.apply(createMessage('1200'))).toHaveLength(0);
    });

    it('should pass for 6-digit time HHMMSS', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('tm'));
      expect(rule.apply(createMessage('120000'))).toHaveLength(0);
    });

    it('should fail for non-numeric time', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('tm'));
      const errors = rule.apply(createMessage('12:00'));
      expect(errors).toHaveLength(1);
      expect(errors[0]!.code).toBe('INVALID_TIME_FORMAT');
    });
  });

  describe('dataType: r (decimal)', () => {
    it('should pass for integer', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('r'));
      expect(rule.apply(createMessage('100'))).toHaveLength(0);
    });

    it('should pass for decimal', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('r'));
      expect(rule.apply(createMessage('99.99'))).toHaveLength(0);
    });

    it('should fail for alphabetic', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('r'));
      const errors = rule.apply(createMessage('ABC'));
      expect(errors).toHaveLength(1);
      expect(errors[0]!.code).toBe('INVALID_DATA_TYPE');
    });
  });

  describe('dataType: b (binary)', () => {
    it('should always pass (no validation for binary)', () => {
      const rule = new ElementDataTypeRule(createStructureWithElement('b'));
      expect(rule.apply(createMessage('anything!!!'))).toHaveLength(0);
    });
  });

  describe('no dataType', () => {
    it('should skip validation when dataType is not defined', () => {
      const structure: MessageStructureDTO = {
        standard: 'X12', version: '004010', messageType: '850', name: 'PO',
        structure: [{
          nodeType: 'segment', tag: 'BEG', name: 'Beginning', mandatory: true, maxOccurrences: 1, position: 10,
          elements: [
            { nodeType: 'element', code: '353', name: 'Code', mandatory: false, position: 1 }
          ]
        } as SegmentNode]
      };
      const rule = new ElementDataTypeRule(structure);
      expect(rule.apply(createMessage('anything'))).toHaveLength(0);
    });
  });
});
