import { describe, it, expect, beforeEach } from 'vitest';
import { ComposableValidationService } from '@application';
import { ValidationServiceBuilder } from '@application';
import { EDIMessage, Standard, Version, MessageType, EDISegment } from '@domain';

describe('ComposableValidationService', () => {
  let service: ComposableValidationService<EDIMessage>;

  beforeEach(() => {
    service = new ComposableValidationService<EDIMessage>();
  });

  describe('addRule and removeRule', () => {
    it('should allow adding rules', () => {
      const ruleIds = service.getRuleIds();
      expect(ruleIds).toHaveLength(0);

      service.addRule({
        ruleId: 'TEST_RULE',
        description: 'Test rule',
        apply: () => []
      });

      expect(service.getRuleIds()).toHaveLength(1);
      expect(service.getRuleIds()).toContain('TEST_RULE');
    });

    it('should allow removing rules by ID', () => {
      service.addRule({
        ruleId: 'RULE_1',
        description: 'Rule 1',
        apply: () => []
      });

      service.addRule({
        ruleId: 'RULE_2',
        description: 'Rule 2',
        apply: () => []
      });

      expect(service.getRuleIds()).toHaveLength(2);

      service.removeRule('RULE_1');
      expect(service.getRuleIds()).toHaveLength(1);
      expect(service.getRuleIds()).toContain('RULE_2');
    });

    it('should support method chaining', () => {
      const result = service
        .addRule({
          ruleId: 'RULE_1',
          description: 'Rule 1',
          apply: () => []
        })
        .addRule({
          ruleId: 'RULE_2',
          description: 'Rule 2',
          apply: () => []
        });

      expect(result).toBe(service);
      expect(service.getRuleIds()).toHaveLength(2);
    });
  });

  describe('validate', () => {
    it('should return success when no rules are registered', () => {
      const message = new EDIMessage('test-id', Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      const result = service.validate(message);
      expect(result.isValid).toBe(true);
    });

    it('should apply all registered rules', () => {
      const message = new EDIMessage('test-id', Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      let rule1Called = false;
      let rule2Called = false;

      service.addRule({
        ruleId: 'RULE_1',
        description: 'Rule 1',
        apply: () => {
          rule1Called = true;
          return [];
        }
      });

      service.addRule({
        ruleId: 'RULE_2',
        description: 'Rule 2',
        apply: () => {
          rule2Called = true;
          return [];
        }
      });

      service.validate(message);

      expect(rule1Called).toBe(true);
      expect(rule2Called).toBe(true);
    });

    it('should collect errors from all rules', () => {
      const message = new EDIMessage('test-id', Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.96A'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      service.addRule({
        ruleId: 'RULE_1',
        description: 'Rule 1',
        apply: () => [
          { field: 'field1', message: 'Error 1', code: 'ERR1' } as any
        ]
      });

      service.addRule({
        ruleId: 'RULE_2',
        description: 'Rule 2',
        apply: () => [
          { field: 'field2', message: 'Error 2', code: 'ERR2' } as any
        ]
      });

      const result = service.validate(message);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]?.field).toBe('field1');
      expect(result.errors[1]?.field).toBe('field2');
    });
  });

  describe('clear', () => {
    it('should remove all rules', () => {
      service.addRule({
        ruleId: 'RULE_1',
        description: 'Rule 1',
        apply: () => []
      });

      service.addRule({
        ruleId: 'RULE_2',
        description: 'Rule 2',
        apply: () => []
      });

      expect(service.getRuleIds()).toHaveLength(2);

      service.clear();

      expect(service.getRuleIds()).toHaveLength(0);
    });
  });
});

describe('ValidationServiceBuilder', () => {
  describe('forEDIFACT', () => {
    it('should create validator with basic and EDIFACT rules', () => {
      const validator = ValidationServiceBuilder.forEDIFACT();
      const ruleIds = validator.getRuleIds();

      expect(ruleIds).toContain('MESSAGE_MUST_HAVE_SEGMENTS');
      expect(ruleIds).toContain('VERSION_STANDARD_MUST_MATCH');
      expect(ruleIds).toContain('EDIFACT_UNB_MUST_BE_FIRST');
      expect(ruleIds).toContain('EDIFACT_UNZ_MUST_BE_LAST');
    });

    it('should validate EDIFACT message structure', () => {
      const validator = ValidationServiceBuilder.forEDIFACT();

      // Invalid: doesn't start with UNB
      const invalidMessage = new EDIMessage('test-id', Standard.EDIFACT,
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
      const validator = ValidationServiceBuilder.forEDIFACT();

      const validMessage = new EDIMessage('test-id', Standard.EDIFACT,
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
      const validator = ValidationServiceBuilder.custom()
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
  });
});
