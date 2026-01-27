import { describe, it, expect, beforeEach } from 'vitest';
import { BusinessObjectValidator } from './BusinessObjectValidator';
import type { JSONSchema } from './JSONSchema';

describe('BusinessObjectValidator', () => {
  let validator: BusinessObjectValidator;

  beforeEach(() => {
    validator = new BusinessObjectValidator();
  });

  describe('validate', () => {
    it('should validate simple object successfully', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          documentNumber: { type: 'string' }
        },
        required: ['documentNumber']
      };

      const businessObject = {
        documentNumber: 'PO12345'
      };

      const result = validator.validate(businessObject, schema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when required field is missing', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          documentNumber: { type: 'string' }
        },
        required: ['documentNumber']
      };

      const businessObject = {};

      const result = validator.validate(businessObject, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('documentNumber');
      expect(result.errors[0].message).toContain('Required');
    });

    it('should validate type: string', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      };

      const validObject = { name: 'Test' };
      const invalidObject = { name: 123 };

      expect(validator.validate(validObject, schema).isValid).toBe(true);
      expect(validator.validate(invalidObject, schema).isValid).toBe(false);
    });

    it('should validate type: number', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          quantity: { type: 'number' }
        }
      };

      const validObject = { quantity: 100 };
      const invalidObject = { quantity: 'not-a-number' };

      expect(validator.validate(validObject, schema).isValid).toBe(true);
      expect(validator.validate(invalidObject, schema).isValid).toBe(false);
    });

    it('should validate maxLength constraint', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          code: { type: 'string', maxLength: 5 }
        }
      };

      const validObject = { code: 'ABC' };
      const invalidObject = { code: 'ABCDEF' };

      expect(validator.validate(validObject, schema).isValid).toBe(true);

      const result = validator.validate(invalidObject, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('maxLength');
    });

    it('should validate array type', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      };

      const validObject = { items: ['A', 'B', 'C'] };
      const invalidObject = { items: 'not-an-array' };

      expect(validator.validate(validObject, schema).isValid).toBe(true);
      expect(validator.validate(invalidObject, schema).isValid).toBe(false);
    });

    it('should validate maxItems constraint', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            maxItems: 3
          }
        }
      };

      const validObject = { items: [1, 2, 3] };
      const invalidObject = { items: [1, 2, 3, 4] };

      expect(validator.validate(validObject, schema).isValid).toBe(true);

      const result = validator.validate(invalidObject, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('maxItems');
    });

    it('should validate nested objects', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          party: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              id: { type: 'string' }
            },
            required: ['name']
          }
        }
      };

      const validObject = {
        party: { name: 'ACME Corp', id: '12345' }
      };
      const invalidObject = {
        party: { id: '12345' } // missing name
      };

      expect(validator.validate(validObject, schema).isValid).toBe(true);

      const result = validator.validate(invalidObject, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('party.name');
    });

    it('should validate array of objects', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          lineItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                lineNumber: { type: 'number' },
                quantity: { type: 'number' }
              },
              required: ['lineNumber']
            }
          }
        }
      };

      const validObject = {
        lineItems: [
          { lineNumber: 1, quantity: 10 },
          { lineNumber: 2, quantity: 20 }
        ]
      };

      const invalidObject = {
        lineItems: [
          { quantity: 10 } // missing lineNumber
        ]
      };

      expect(validator.validate(validObject, schema).isValid).toBe(true);

      const result = validator.validate(invalidObject, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('lineItems[0].lineNumber');
    });

    it('should accumulate multiple errors', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          field1: { type: 'string' },
          field2: { type: 'number' },
          field3: { type: 'string' }
        },
        required: ['field1', 'field2', 'field3']
      };

      const businessObject = {
        field2: 'wrong-type' // field1 and field3 missing, field2 wrong type
      };

      const result = validator.validate(businessObject, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });
});
