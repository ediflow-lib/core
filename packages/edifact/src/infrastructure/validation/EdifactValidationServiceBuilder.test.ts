import { describe, it, expect } from 'vitest';
import {
  EdifactValidationServiceBuilder,
  UNBMustBeFirstRule,
  UNZMustBeLastRule,
  EDIFACTSegmentTagFormatRule
} from './index';
import { EDIMessage, Standard, Version, MessageType, EDISegment } from '@ediflow/core';

describe('EdifactValidationServiceBuilder', () => {
  describe('forEDIFACT', () => {
    it('should create validator with basic and EDIFACT rules', () => {
      const validator = EdifactValidationServiceBuilder.forEDIFACT();
      const ruleIds = validator.getRuleIds();

      expect(ruleIds).toContain('MESSAGE_MUST_HAVE_SEGMENTS');
      expect(ruleIds).toContain('VERSION_STANDARD_MUST_MATCH');
      expect(ruleIds).toContain('EDIFACT_UNB_MUST_BE_FIRST');
      expect(ruleIds).toContain('EDIFACT_UNZ_MUST_BE_LAST');
      expect(ruleIds).toContain('EDIFACT_SEGMENT_TAG_FORMAT');
    });

    it('should validate EDIFACT message structure - reject invalid first segment', () => {
      const validator = EdifactValidationServiceBuilder.forEDIFACT();

      const invalidMessage = new EDIMessage(
        'test-id',
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );
      invalidMessage.addSegment(new EDISegment('BGM', []));
      invalidMessage.addSegment(new EDISegment('UNZ', []));

      const result = validator.validate(invalidMessage);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_FIRST_SEGMENT')).toBe(true);
    });

    it('should accept valid EDIFACT message', () => {
      const validator = EdifactValidationServiceBuilder.forEDIFACT();

      const validMessage = new EDIMessage(
        'test-id',
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );
      validMessage.addSegment(new EDISegment('UNB', []));
      validMessage.addSegment(new EDISegment('UNH', []));
      validMessage.addSegment(new EDISegment('BGM', []));
      validMessage.addSegment(new EDISegment('UNT', []));
      validMessage.addSegment(new EDISegment('UNZ', []));

      const result = validator.validate(validMessage);
      expect(result.isValid).toBe(true);
    });
  });

  describe('custom', () => {
    it('should allow building custom validators', () => {
      const validator = EdifactValidationServiceBuilder.custom()
        .withBasicRules()
        .withCustomRule({
          ruleId: 'MY_CUSTOM_RULE',
          description: 'My custom rule',
          apply: () => []
        })
        .build();

      const ruleIds = validator.getRuleIds();
      expect(ruleIds).toContain('MESSAGE_MUST_HAVE_SEGMENTS');
      expect(ruleIds).toContain('MY_CUSTOM_RULE');
      expect(ruleIds).not.toContain('EDIFACT_UNB_MUST_BE_FIRST');
    });

    it('should allow adding EDIFACT rules selectively', () => {
      const validator = EdifactValidationServiceBuilder.custom()
        .withBasicRules()
        .withEDIFACTRules()
        .build();

      const ruleIds = validator.getRuleIds();
      expect(ruleIds).toContain('MESSAGE_MUST_HAVE_SEGMENTS');
      expect(ruleIds).toContain('EDIFACT_UNB_MUST_BE_FIRST');
      expect(ruleIds).toContain('EDIFACT_UNZ_MUST_BE_LAST');
      expect(ruleIds).toContain('EDIFACT_SEGMENT_TAG_FORMAT');
    });
  });

  describe('individual rules', () => {
    it('UNBMustBeFirstRule should validate first segment', () => {
      const rule = new UNBMustBeFirstRule();

      const message = new EDIMessage(
        'test-id',
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );
      message.addSegment(new EDISegment('BGM', []));

      const errors = rule.apply(message);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_FIRST_SEGMENT');
    });

    it('UNZMustBeLastRule should validate last segment', () => {
      const rule = new UNZMustBeLastRule();

      const message = new EDIMessage(
        'test-id',
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );
      message.addSegment(new EDISegment('UNB', []));
      message.addSegment(new EDISegment('BGM', []));

      const errors = rule.apply(message);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_LAST_SEGMENT');
    });

    it('EDIFACTSegmentTagFormatRule should validate tag format', () => {
      const rule = new EDIFACTSegmentTagFormatRule();

      const message = new EDIMessage(
        'test-id',
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );
      message.addSegment(new EDISegment('UNB', []));
      message.addSegment(new EDISegment('INVALID', []));
      message.addSegment(new EDISegment('UNZ', []));

      const errors = rule.apply(message);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_SEGMENT_TAG');
      expect(errors[0].message).toContain('INVALID');
    });
  });
});
