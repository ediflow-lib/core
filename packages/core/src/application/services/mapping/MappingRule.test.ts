import { describe, it, expect } from 'vitest';
import type { MappingRule } from './MappingRule';

describe('MappingRule', () => {
  describe('Interface Type Safety', () => {
    it('should accept valid basic mapping rule', () => {
      const rule: MappingRule = {
        targetField: 'documentNumber',
        elementIndex: 0,
      };

      expect(rule.targetField).toBe('documentNumber');
      expect(rule.elementIndex).toBe(0);
    });

    it('should accept mapping rule with type conversion', () => {
      const rule: MappingRule = {
        targetField: 'documentDate',
        elementIndex: 1,
        typeConversion: 'date',
        dateFormat: 'YYYYMMDD',
      };

      expect(rule.typeConversion).toBe('date');
      expect(rule.dateFormat).toBe('YYYYMMDD');
    });

    it('should accept mapping rule with component index for composites', () => {
      const rule: MappingRule = {
        targetField: 'messageType',
        elementIndex: 1,
        componentIndex: 0,
      };

      expect(rule.componentIndex).toBe(0);
    });

    it('should accept mapping rule for array fields', () => {
      const rule: MappingRule = {
        targetField: 'lineItems',
        elementIndex: 0,
        isArray: true,
      };

      expect(rule.isArray).toBe(true);
    });

    it('should accept mapping rule with nested mapping', () => {
      const rule: MappingRule = {
        targetField: 'parties',
        elementIndex: 0,
        isArray: true,
        nestedMapping: [
          { targetField: 'role', elementIndex: 0 },
          { targetField: 'partyId', elementIndex: 1 },
        ],
      };

      expect(rule.nestedMapping).toHaveLength(2);
      expect(rule.nestedMapping![0]?.targetField).toBe('role');
    });

    it('should accept all type conversion options', () => {
      const conversions: Array<MappingRule['typeConversion']> = [
        'string',
        'number',
        'date',
        'boolean',
      ];

      conversions.forEach((conversion) => {
        const rule: MappingRule = {
          targetField: 'testField',
          elementIndex: 0,
          typeConversion: conversion,
        };
        expect(rule.typeConversion).toBe(conversion);
      });
    });
  });
});
