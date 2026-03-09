import { describe, it, expect } from 'vitest';
import { ElementLengthRule } from '@application';
import { EDIMessage, Standard, Version, MessageType, EDISegment, EDIElement } from '@domain';
import type { MessageStructureDTO, SegmentNode } from '@application/dtos';

const createStructure = (minLength?: number, maxLength?: number): MessageStructureDTO => ({
  standard: 'X12', version: '004010', messageType: '850', name: 'PO',
  structure: [{
    nodeType: 'segment', tag: 'BEG', name: 'Beginning', mandatory: true, maxOccurrences: 1, position: 10,
    elements: [
      { nodeType: 'element', code: '353', name: 'PurposeCode', mandatory: false, position: 1, minLength, maxLength }
    ]
  } as SegmentNode]
});

const createMessage = (value: string): EDIMessage => {
  const msg = new EDIMessage('id', Standard.X12, new Version(Standard.X12, '004010'), new MessageType(Standard.X12, '850'));
  msg.addSegment(new EDISegment('BEG', [new EDIElement(value)]));
  return msg;
};

describe('ElementLengthRule', () => {
  describe('maxLength', () => {
    it('should pass when value is within maxLength', () => {
      const rule = new ElementLengthRule(createStructure(undefined, 5));
      expect(rule.apply(createMessage('ABC'))).toHaveLength(0);
    });

    it('should pass when value equals maxLength exactly', () => {
      const rule = new ElementLengthRule(createStructure(undefined, 3));
      expect(rule.apply(createMessage('ABC'))).toHaveLength(0);
    });

    it('should fail when value exceeds maxLength', () => {
      const rule = new ElementLengthRule(createStructure(undefined, 3));
      const errors = rule.apply(createMessage('TOOLONG'));
      expect(errors).toHaveLength(1);
      expect(errors[0]!.code).toBe('ELEMENT_TOO_LONG');
      expect(errors[0]!.field).toBe('BEG[0].353[1]');
    });
  });

  describe('minLength', () => {
    it('should pass when value meets minLength', () => {
      const rule = new ElementLengthRule(createStructure(2, 10));
      expect(rule.apply(createMessage('AB'))).toHaveLength(0);
    });

    it('should fail when value is shorter than minLength', () => {
      const rule = new ElementLengthRule(createStructure(3, 10));
      const errors = rule.apply(createMessage('AB'));
      expect(errors).toHaveLength(1);
      expect(errors[0]!.code).toBe('ELEMENT_TOO_SHORT');
      expect(errors[0]!.field).toBe('BEG[0].353[1]');
    });
  });

  describe('empty values', () => {
    it('should skip empty values (mandatory check is separate)', () => {
      const rule = new ElementLengthRule(createStructure(2, 10));
      expect(rule.apply(createMessage(''))).toHaveLength(0);
    });
  });

  describe('no length constraints', () => {
    it('should skip when no minLength or maxLength defined', () => {
      const rule = new ElementLengthRule(createStructure());
      expect(rule.apply(createMessage('ANYTHING'))).toHaveLength(0);
    });
  });

  describe('ruleId', () => {
    it('should have correct ruleId', () => {
      const rule = new ElementLengthRule(createStructure(1, 10));
      expect(rule.ruleId).toBe('ELEMENT_LENGTH_VALIDATION');
    });
  });
});

