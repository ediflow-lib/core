import { describe, it, expect } from 'vitest';
import { MandatoryElementRule } from '@application';
import { EDIMessage, Standard, Version, MessageType, EDISegment, EDIElement } from '@domain';
import type { MessageStructureDTO, SegmentNode } from '@application/dtos';

const createStructure = (mandatory: boolean): MessageStructureDTO => ({
  standard: 'X12', version: '004010', messageType: '850', name: 'PO',
  structure: [{
    nodeType: 'segment', tag: 'BEG', name: 'Beginning', mandatory: true, maxOccurrences: 1, position: 10,
    elements: [
      { nodeType: 'element', code: '353', name: 'PurposeCode', mandatory, position: 1 }
    ]
  } as SegmentNode]
});

const createMessage = (value: string): EDIMessage => {
  const msg = new EDIMessage('id', Standard.X12, new Version(Standard.X12, '004010'), new MessageType(Standard.X12, '850'));
  msg.addSegment(new EDISegment('BEG', [new EDIElement(value)]));
  return msg;
};

const createMessageWithNoElements = (): EDIMessage => {
  const msg = new EDIMessage('id', Standard.X12, new Version(Standard.X12, '004010'), new MessageType(Standard.X12, '850'));
  msg.addSegment(new EDISegment('BEG', []));
  return msg;
};

describe('MandatoryElementRule', () => {
  describe('mandatory element present', () => {
    it('should pass when mandatory element has a value', () => {
      const rule = new MandatoryElementRule(createStructure(true));
      expect(rule.apply(createMessage('00'))).toHaveLength(0);
    });
  });

  describe('mandatory element missing', () => {
    it('should fail when mandatory element is empty string', () => {
      const rule = new MandatoryElementRule(createStructure(true));
      const errors = rule.apply(createMessage(''));
      expect(errors).toHaveLength(1);
      expect(errors[0]!.code).toBe('MISSING_MANDATORY_ELEMENT');
      expect(errors[0]!.field).toBe('BEG[0].353[1]');
    });

    it('should fail when mandatory element position is beyond segment elements', () => {
      const rule = new MandatoryElementRule(createStructure(true));
      const errors = rule.apply(createMessageWithNoElements());
      expect(errors).toHaveLength(1);
      expect(errors[0]!.code).toBe('MISSING_MANDATORY_ELEMENT');
    });
  });

  describe('optional element', () => {
    it('should pass when optional element is empty', () => {
      const rule = new MandatoryElementRule(createStructure(false));
      expect(rule.apply(createMessage(''))).toHaveLength(0);
    });

    it('should pass when optional element is missing entirely', () => {
      const rule = new MandatoryElementRule(createStructure(false));
      expect(rule.apply(createMessageWithNoElements())).toHaveLength(0);
    });
  });

  describe('segment not in message', () => {
    it('should skip validation when segment is absent', () => {
      const rule = new MandatoryElementRule(createStructure(true));
      const msg = new EDIMessage('id', Standard.X12, new Version(Standard.X12, '004010'), new MessageType(Standard.X12, '850'));
      msg.addSegment(new EDISegment('REF', [new EDIElement('PO')]));
      expect(rule.apply(msg)).toHaveLength(0);
    });
  });

  describe('ruleId', () => {
    it('should have correct ruleId', () => {
      const rule = new MandatoryElementRule(createStructure(true));
      expect(rule.ruleId).toBe('MANDATORY_ELEMENT_VALIDATION');
    });
  });
});

