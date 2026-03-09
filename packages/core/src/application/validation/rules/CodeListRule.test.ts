import { describe, it, expect } from 'vitest';
import { CodeListRule } from '@application';
import { EDIMessage, Standard, Version, MessageType, EDISegment, EDIElement } from '@domain';
import type { MessageStructureDTO, SegmentNode } from '@application/dtos';

const createStructureWithCodeList = (codeListCode: string): MessageStructureDTO => ({
  standard: 'X12', version: '004010', messageType: '850', name: 'PO',
  structure: [{
    nodeType: 'segment', tag: 'BEG', name: 'Beginning', mandatory: true, maxOccurrences: 1, position: 10,
    elements: [
      { nodeType: 'element', code: '353', name: 'PurposeCode', mandatory: true, position: 1, codeListCode }
    ]
  } as SegmentNode]
});

const createMessage = (value: string): EDIMessage => {
  const message = new EDIMessage('id', Standard.X12, new Version(Standard.X12, '004010'), new MessageType(Standard.X12, '850'));
  message.addSegment(new EDISegment('BEG', [new EDIElement(value)]));
  return message;
};

const validCodes = new Map<string, Set<string>>([
  ['353', new Set(['00', '01', '02', '03', '04', '05'])]
]);

describe('CodeListRule', () => {
  describe('with valid code lists', () => {
    it('should pass when element value is in the code list', () => {
      const rule = new CodeListRule(createStructureWithCodeList('353'), validCodes);
      expect(rule.apply(createMessage('00'))).toHaveLength(0);
    });

    it('should pass when element value is another valid code', () => {
      const rule = new CodeListRule(createStructureWithCodeList('353'), validCodes);
      expect(rule.apply(createMessage('05'))).toHaveLength(0);
    });

    it('should fail when element value is not in the code list', () => {
      const rule = new CodeListRule(createStructureWithCodeList('353'), validCodes);
      const errors = rule.apply(createMessage('XX'));
      expect(errors).toHaveLength(1);
      expect(errors[0]!.code).toBe('INVALID_CODE_VALUE');
      expect(errors[0]!.message).toContain('XX');
      expect(errors[0]!.message).toContain('353');
    });

    it('should include field path in error', () => {
      const rule = new CodeListRule(createStructureWithCodeList('353'), validCodes);
      const errors = rule.apply(createMessage('ZZ'));
      expect(errors[0]!.field).toBe('BEG[0].353[1]');
    });
  });

  describe('empty values', () => {
    it('should skip validation for empty element value', () => {
      const rule = new CodeListRule(createStructureWithCodeList('353'), validCodes);
      expect(rule.apply(createMessage(''))).toHaveLength(0);
    });
  });

  describe('missing code list', () => {
    it('should skip validation when code list is not loaded', () => {
      const emptyCodes = new Map<string, Set<string>>();
      const rule = new CodeListRule(createStructureWithCodeList('353'), emptyCodes);
      expect(rule.apply(createMessage('XX'))).toHaveLength(0);
    });
  });

  describe('element without codeListCode', () => {
    it('should skip validation when element has no codeListCode', () => {
      const structure: MessageStructureDTO = {
        standard: 'X12', version: '004010', messageType: '850', name: 'PO',
        structure: [{
          nodeType: 'segment', tag: 'BEG', name: 'Beginning', mandatory: true, maxOccurrences: 1, position: 10,
          elements: [
            { nodeType: 'element', code: '353', name: 'Code', mandatory: false, position: 1 }
          ]
        } as SegmentNode]
      };
      const rule = new CodeListRule(structure, validCodes);
      expect(rule.apply(createMessage('ANYTHING'))).toHaveLength(0);
    });
  });

  describe('multiple segments', () => {
    it('should validate all segment instances', () => {
      const structure: MessageStructureDTO = {
        standard: 'X12', version: '004010', messageType: '850', name: 'PO',
        structure: [{
          nodeType: 'segment', tag: 'REF', name: 'Reference', mandatory: false, maxOccurrences: 99, position: 20,
          elements: [
            { nodeType: 'element', code: '128', name: 'Qualifier', mandatory: true, position: 1, codeListCode: '128' }
          ]
        } as SegmentNode]
      };
      const codes = new Map<string, Set<string>>([['128', new Set(['PO', 'IV', 'CR'])]]);
      const rule = new CodeListRule(structure, codes);

      const message = new EDIMessage('id', Standard.X12, new Version(Standard.X12, '004010'), new MessageType(Standard.X12, '850'));
      message.addSegment(new EDISegment('REF', [new EDIElement('PO')]));
      message.addSegment(new EDISegment('REF', [new EDIElement('INVALID')]));
      message.addSegment(new EDISegment('REF', [new EDIElement('IV')]));

      const errors = rule.apply(message);
      expect(errors).toHaveLength(1);
      expect(errors[0]!.message).toContain('INVALID');
    });
  });

  describe('ruleId and description', () => {
    it('should have correct ruleId', () => {
      const rule = new CodeListRule(createStructureWithCodeList('353'), validCodes);
      expect(rule.ruleId).toBe('CODE_LIST_VALIDATION');
    });
  });
});

