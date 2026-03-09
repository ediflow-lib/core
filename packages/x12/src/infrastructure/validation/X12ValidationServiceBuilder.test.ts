import { describe, it, expect } from 'vitest';
import {
  X12ValidationServiceBuilder,
  ValidationLevel,
  ISAMustBeFirstRule,
  IEAMustBeLastRule,
  X12SegmentTagFormatRule,
  X12EnvelopeIntegrityRule
} from './index';
import { EDIMessage, Standard, Version, MessageType, EDISegment, EDIElement } from '@ediflow/core';
import type { MessageStructureDTO, SegmentNode } from '@ediflow/core';

const createX12Message = (): EDIMessage => {
  const message = new EDIMessage(
    'test-id',
    Standard.X12,
    new Version(Standard.X12, '004010'),
    new MessageType(Standard.X12, '850')
  );
  message.addSegment(new EDISegment('ISA', [
    new EDIElement('00'), new EDIElement('          '),
    new EDIElement('00'), new EDIElement('          '),
    new EDIElement('ZZ'), new EDIElement('SENDER         '),
    new EDIElement('ZZ'), new EDIElement('RECEIVER       '),
    new EDIElement('240124'), new EDIElement('1200'),
    new EDIElement('^'),
    new EDIElement('00501'),
    new EDIElement('000000001'),
    new EDIElement('0'), new EDIElement('T'), new EDIElement('>')
  ]));
  message.addSegment(new EDISegment('GS', []));
  message.addSegment(new EDISegment('ST', []));
  message.addSegment(new EDISegment('BEG', []));
  message.addSegment(new EDISegment('SE', []));
  message.addSegment(new EDISegment('GE', []));
  message.addSegment(new EDISegment('IEA', [
    new EDIElement('1'),
    new EDIElement('000000001')
  ]));
  return message;
};

describe('X12ValidationServiceBuilder', () => {
  describe('forX12', () => {
    it('should create validator with basic and X12 rules', () => {
      const validator = X12ValidationServiceBuilder.forX12();
      const ruleIds = validator.getRuleIds();

      expect(ruleIds).toContain('MESSAGE_MUST_HAVE_SEGMENTS');
      expect(ruleIds).toContain('VERSION_STANDARD_MUST_MATCH');
      expect(ruleIds).toContain('X12_ISA_MUST_BE_FIRST');
      expect(ruleIds).toContain('X12_IEA_MUST_BE_LAST');
      expect(ruleIds).toContain('X12_SEGMENT_TAG_FORMAT');
      expect(ruleIds).toContain('X12_ENVELOPE_INTEGRITY');
    });

    it('should accept valid X12 message', () => {
      const validator = X12ValidationServiceBuilder.forX12();

      const result = validator.validate(createX12Message());

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject message with wrong first segment', () => {
      const validator = X12ValidationServiceBuilder.forX12();
      const message = new EDIMessage('id', Standard.X12, new Version(Standard.X12, '004010'), new MessageType(Standard.X12, '850'));
      message.addSegment(new EDISegment('GS', []));
      message.addSegment(new EDISegment('IEA', []));

      const result = validator.validate(message);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_FIRST_SEGMENT')).toBe(true);
    });

    it('should reject message with wrong last segment', () => {
      const validator = X12ValidationServiceBuilder.forX12();
      const message = new EDIMessage('id', Standard.X12, new Version(Standard.X12, '004010'), new MessageType(Standard.X12, '850'));
      message.addSegment(new EDISegment('ISA', []));
      message.addSegment(new EDISegment('GS', []));

      const result = validator.validate(message);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_LAST_SEGMENT')).toBe(true);
    });

    it('should reject message with envelope control number mismatch', () => {
      const validator = X12ValidationServiceBuilder.forX12();
      const message = new EDIMessage('id', Standard.X12, new Version(Standard.X12, '004010'), new MessageType(Standard.X12, '850'));
      message.addSegment(new EDISegment('ISA', [
        ...Array(12).fill(new EDIElement('')),
        new EDIElement('000000001')
      ]));
      message.addSegment(new EDISegment('IEA', [
        new EDIElement('1'),
        new EDIElement('000000999')
      ]));

      const result = validator.validate(message);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'ENVELOPE_CONTROL_NUMBER_MISMATCH')).toBe(true);
    });
  });

  describe('custom', () => {
    it('should create empty builder for custom validators', () => {
      const validator = X12ValidationServiceBuilder.custom()
        .withBasicRules()
        .build();
      const ruleIds = validator.getRuleIds();

      expect(ruleIds).toContain('MESSAGE_MUST_HAVE_SEGMENTS');
      expect(ruleIds).not.toContain('X12_ISA_MUST_BE_FIRST');
    });

    it('should support adding custom rules', () => {
      const validator = X12ValidationServiceBuilder.custom()
        .withX12Rules()
        .build();
      const ruleIds = validator.getRuleIds();

      expect(ruleIds).toContain('X12_ISA_MUST_BE_FIRST');
      expect(ruleIds).not.toContain('MESSAGE_MUST_HAVE_SEGMENTS');
    });
  });

  describe('ISAMustBeFirstRule', () => {
    it('should skip non-X12 messages', () => {
      const rule = new ISAMustBeFirstRule();
      const message = new EDIMessage('id', Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.96A'), new MessageType(Standard.EDIFACT, 'ORDERS'));
      message.addSegment(new EDISegment('UNB', []));

      expect(rule.apply(message)).toHaveLength(0);
    });

    it('should skip empty messages', () => {
      const rule = new ISAMustBeFirstRule();
      const message = new EDIMessage('id', Standard.X12, new Version(Standard.X12, '004010'), new MessageType(Standard.X12, '850'));

      expect(rule.apply(message)).toHaveLength(0);
    });
  });

  describe('IEAMustBeLastRule', () => {
    it('should skip non-X12 messages', () => {
      const rule = new IEAMustBeLastRule();
      const message = new EDIMessage('id', Standard.EDIFACT, new Version(Standard.EDIFACT, 'D.96A'), new MessageType(Standard.EDIFACT, 'ORDERS'));
      message.addSegment(new EDISegment('UNZ', []));

      expect(rule.apply(message)).toHaveLength(0);
    });
  });

  describe('X12SegmentTagFormatRule', () => {
    it('should accept valid 2-char tag', () => {
      const rule = new X12SegmentTagFormatRule();
      const message = new EDIMessage('id', Standard.X12, new Version(Standard.X12, '004010'), new MessageType(Standard.X12, '850'));
      message.addSegment(new EDISegment('ST', []));

      expect(rule.apply(message)).toHaveLength(0);
    });

    it('should accept valid 3-char tag', () => {
      const rule = new X12SegmentTagFormatRule();
      const message = new EDIMessage('id', Standard.X12, new Version(Standard.X12, '004010'), new MessageType(Standard.X12, '850'));
      message.addSegment(new EDISegment('ISA', []));

      expect(rule.apply(message)).toHaveLength(0);
    });

    it('should reject tag with lowercase letters', () => {
      const rule = new X12SegmentTagFormatRule();
      const message = new EDIMessage('id', Standard.X12, new Version(Standard.X12, '004010'), new MessageType(Standard.X12, '850'));
      message.addSegment(new EDISegment('isa', []));

      expect(rule.apply(message)).toHaveLength(1);
    });

    it('should reject tag longer than 3 chars', () => {
      const rule = new X12SegmentTagFormatRule();
      const message = new EDIMessage('id', Standard.X12, new Version(Standard.X12, '004010'), new MessageType(Standard.X12, '850'));
      message.addSegment(new EDISegment('TOOLONG', []));

      expect(rule.apply(message)).toHaveLength(1);
    });
  });

  describe('X12EnvelopeIntegrityRule', () => {
    it('should accept matching control numbers', () => {
      const rule = new X12EnvelopeIntegrityRule();

      expect(rule.apply(createX12Message())).toHaveLength(0);
    });

    it('should skip message without ISA/IEA', () => {
      const rule = new X12EnvelopeIntegrityRule();
      const message = new EDIMessage('id', Standard.X12, new Version(Standard.X12, '004010'), new MessageType(Standard.X12, '850'));
      message.addSegment(new EDISegment('GS', []));

      expect(rule.apply(message)).toHaveLength(0);
    });
  });

  describe('withElementRules and forX12Strict', () => {
    const createStructureWith850BEG = (): MessageStructureDTO => ({
      standard: 'X12', version: '004010', messageType: '850', name: 'PO',
      structure: [{
        nodeType: 'segment', tag: 'BEG', name: 'Beginning', mandatory: true, maxOccurrences: 1, position: 10,
        elements: [
          { nodeType: 'element', code: '353', name: 'PurposeCode', mandatory: true, position: 1, dataType: 'n', maxLength: 2 }
        ]
      } as SegmentNode]
    });

    it('should include ELEMENT_DATA_TYPE rule when withElementRules is called', () => {
      const structure = createStructureWith850BEG();
      const validator = X12ValidationServiceBuilder.custom()
        .withElementRules(structure)
        .build();

      expect(validator.getRuleIds()).toContain('ELEMENT_DATA_TYPE');
    });

    it('should include ELEMENT_DATA_TYPE rule in forX12Strict', () => {
      const structure = createStructureWith850BEG();
      const validator = X12ValidationServiceBuilder.forX12Strict(structure);

      expect(validator.getRuleIds()).toContain('ELEMENT_DATA_TYPE');
      expect(validator.getRuleIds()).toContain('X12_ISA_MUST_BE_FIRST');
    });

    it('forX12Strict should catch invalid data type', () => {
      const structure = createStructureWith850BEG();
      const validator = X12ValidationServiceBuilder.forX12Strict(structure);

      const message = new EDIMessage('id', Standard.X12, new Version(Standard.X12, '004010'), new MessageType(Standard.X12, '850'));
      message.addSegment(new EDISegment('ISA', [
        new EDIElement('00'), new EDIElement('          '),
        new EDIElement('00'), new EDIElement('          '),
        new EDIElement('ZZ'), new EDIElement('SENDER         '),
        new EDIElement('ZZ'), new EDIElement('RECEIVER       '),
        new EDIElement('240124'), new EDIElement('1200'),
        new EDIElement('^'), new EDIElement('00501'),
        new EDIElement('000000001'),
        new EDIElement('0'), new EDIElement('T'), new EDIElement('>')
      ]));
      message.addSegment(new EDISegment('BEG', [new EDIElement('NOT-NUMERIC')]));
      message.addSegment(new EDISegment('IEA', [new EDIElement('1'), new EDIElement('000000001')]));

      const result = validator.validate(message);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_DATA_TYPE')).toBe(true);
    });
  });

  describe('ValidationLevel', () => {
    it('LENIENT should include basic + X12 rules (no element rules)', () => {
      const validator = X12ValidationServiceBuilder.custom()
        .withValidationLevel(ValidationLevel.LENIENT)
        .build();

      expect(validator.getRuleIds()).toContain('MESSAGE_MUST_HAVE_SEGMENTS');
      expect(validator.getRuleIds()).toContain('X12_ISA_MUST_BE_FIRST');
      expect(validator.getRuleIds()).not.toContain('ELEMENT_DATA_TYPE');
    });

    it('STRICT with structure should include element type rules', () => {
      const structure = ({
        standard: 'X12', version: '004010', messageType: '850', name: 'PO', structure: []
      } as MessageStructureDTO);

      const validator = X12ValidationServiceBuilder.custom()
        .withValidationLevel(ValidationLevel.STRICT, structure)
        .build();

      expect(validator.getRuleIds()).toContain('ELEMENT_DATA_TYPE');
    });
  });
});
