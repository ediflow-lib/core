import { describe, it, expect, beforeEach } from 'vitest';
import { ComposableValidationService } from '@application';

import { EDIMessage, Standard, Version, MessageType } from '@domain';

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

