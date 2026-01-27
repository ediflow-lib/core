import { describe, it, expect, beforeAll } from 'vitest';
import { BusinessObjectSchemaGenerator } from '@domain/validation/BusinessObjectSchemaGenerator';
import { BusinessObjectValidator } from '@domain/validation/BusinessObjectValidator';
import { SchemaCache } from '@domain/validation/SchemaCache';
import type { MessageStructure, SegmentNode, SegmentGroupNode, ElementNode } from '@domain/repositories/MessageStructure';

describe('Integration: BusinessObject Schema Validation (US-7.8)', () => {
  let generator: BusinessObjectSchemaGenerator;
  let validator: BusinessObjectValidator;
  let desadvStructure: MessageStructure;

  beforeAll(() => {
    const cache = new SchemaCache();
    generator = new BusinessObjectSchemaGenerator(cache);
    validator = new BusinessObjectValidator();

    desadvStructure = {
      standard: 'EDIFACT',
      version: 'D.20B',
      messageType: 'DESADV',
      name: 'Despatch advice message',
      description: 'Notification of goods ready for shipment',
      structure: [
        {
          nodeType: 'segment',
          tag: 'BGM',
          name: 'Beginning of message',
          mandatory: true,
          maxOccurrences: 1,
          position: 10,
          elements: [
            {
              nodeType: 'element',
              code: '1001',
              name: 'documentNumber',
              mandatory: true,
              position: 1,
              dataType: 'an',
              maxLength: 35
            } as ElementNode
          ],
          mapping: {
            targetField: 'documentNumber',
            elementIndex: 0
          }
        } as SegmentNode,
        {
          nodeType: 'segment',
          tag: 'DTM',
          name: 'Date/time/period',
          mandatory: true,
          maxOccurrences: 1,
          position: 20,
          elements: [
            {
              nodeType: 'element',
              code: '2005',
              name: 'documentDate',
              mandatory: true,
              position: 1,
              dataType: 'an',
              maxLength: 8
            } as ElementNode
          ],
          mapping: {
            targetField: 'documentDate',
            elementIndex: 0,
            typeConversion: 'date',
            dateFormat: 'YYYYMMDD'
          }
        } as SegmentNode,
        {
          nodeType: 'segmentGroup',
          id: 'SG1',
          name: 'Parties',
          mandatory: true,
          maxOccurrences: 99,
          position: 30,
          triggerSegment: 'NAD',
          children: [
            {
              nodeType: 'segment',
              tag: 'NAD',
              name: 'Name and address',
              mandatory: true,
              maxOccurrences: 1,
              position: 10,
              elements: [
                {
                  nodeType: 'element',
                  code: '3035',
                  name: 'partyRole',
                  mandatory: true,
                  position: 1,
                  dataType: 'an',
                  maxLength: 3
                } as ElementNode,
                {
                  nodeType: 'element',
                  code: '3039',
                  name: 'partyId',
                  mandatory: false,
                  position: 2,
                  dataType: 'an',
                  maxLength: 35
                } as ElementNode,
                {
                  nodeType: 'element',
                  code: '3036',
                  name: 'partyName',
                  mandatory: false,
                  position: 3,
                  dataType: 'an',
                  maxLength: 70
                } as ElementNode
              ],
              mapping: {
                targetField: 'parties',
                elementIndex: 0,
                isArray: true
              }
            } as SegmentNode
          ],
          mapping: {
            targetField: 'parties',
            elementIndex: 0,
            isArray: true
          }
        } as SegmentGroupNode,
        {
          nodeType: 'segmentGroup',
          id: 'SG10',
          name: 'Line Items',
          mandatory: false,
          maxOccurrences: 999,
          position: 100,
          triggerSegment: 'LIN',
          children: [
            {
              nodeType: 'segment',
              tag: 'LIN',
              name: 'Line item',
              mandatory: true,
              maxOccurrences: 1,
              position: 10,
              elements: [
                {
                  nodeType: 'element',
                  code: '1082',
                  name: 'lineNumber',
                  mandatory: true,
                  position: 1,
                  dataType: 'n',
                  maxLength: 6
                } as ElementNode,
                {
                  nodeType: 'element',
                  code: '7140',
                  name: 'itemNumber',
                  mandatory: false,
                  position: 2,
                  dataType: 'an',
                  maxLength: 35
                } as ElementNode
              ],
              mapping: {
                targetField: 'lineItems',
                elementIndex: 0,
                isArray: true
              }
            } as SegmentNode,
            {
              nodeType: 'segment',
              tag: 'QTY',
              name: 'Quantity',
              mandatory: false,
              maxOccurrences: 1,
              position: 20,
              elements: [
                {
                  nodeType: 'element',
                  code: '6060',
                  name: 'quantity',
                  mandatory: true,
                  position: 1,
                  dataType: 'n'
                } as ElementNode
              ],
              mapping: {
                targetField: 'quantity',
                elementIndex: 0
              }
            } as SegmentNode
          ],
          mapping: {
            targetField: 'lineItems',
            elementIndex: 0,
            isArray: true
          }
        } as SegmentGroupNode
      ]
    };
  });

  describe('Schema Generation from DESADV', () => {
    it('should generate JSON Schema from DESADV MessageStructure', () => {
      const schema = generator.fromMessageStructure(desadvStructure);

      expect(schema).toBeDefined();
      expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(schema.title).toBe('Despatch advice message');
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
    });

    it('should include documentNumber in schema properties', () => {
      const schema = generator.fromMessageStructure(desadvStructure);
      const maxDocumentNumberLength = 35;

      expect(schema.properties?.['documentNumber']).toBeDefined();
      expect(schema.properties?.['documentNumber']?.type).toBe('string');
      expect(schema.properties?.['documentNumber']?.maxLength).toBe(maxDocumentNumberLength);
    });

    it('should mark mandatory fields as required', () => {
      const schema = generator.fromMessageStructure(desadvStructure);

      expect(schema.required).toContain('documentNumber');
      expect(schema.required).toContain('documentDate');
      expect(schema.required).toContain('parties');
    });

    it('should cache generated schema for performance', () => {
      const firstSchema = generator.fromMessageStructure(desadvStructure);
      const secondSchema = generator.fromMessageStructure(desadvStructure);

      expect(firstSchema).toBe(secondSchema);
    });
  });

  describe('BusinessObject Validation - Valid Cases', () => {
    it('should validate valid DESADV business object', () => {
      const schema = generator.fromMessageStructure(desadvStructure);

      const validDesadv = {
        documentNumber: 'DESADV-2026-001',
        documentDate: '20260127',
        parties: [
          {
            partyRole: 'SU',
            partyId: 'SUPPLIER123',
            partyName: 'ACME Supplier Inc.'
          },
          {
            partyRole: 'BY',
            partyId: 'BUYER456',
            partyName: 'Customer Corp'
          }
        ],
        lineItems: [
          {
            lineNumber: 1,
            itemNumber: 'ITEM-001',
            quantity: 100
          },
          {
            lineNumber: 2,
            itemNumber: 'ITEM-002',
            quantity: 50
          }
        ]
      };

      const result = validator.validate(validDesadv, schema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate DESADV with optional fields missing', () => {
      const schema = generator.fromMessageStructure(desadvStructure);

      const minimalDesadv = {
        documentNumber: 'DESADV-MIN-001',
        documentDate: '20260127',
        parties: []
      };

      const result = validator.validate(minimalDesadv, schema);

      expect(result.isValid).toBe(true);
    });
  });

  describe('BusinessObject Validation - Invalid Cases', () => {
    it('should detect missing required field', () => {
      const schema = generator.fromMessageStructure(desadvStructure);

      const invalidDesadv = {
        // documentNumber missing!
        documentDate: '20260127',
        parties: []
      };

      const result = validator.validate(invalidDesadv, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.field).toBe('documentNumber');
      expect(result.errors[0]?.message).toContain('Required');
    });

    it('should detect wrong type for field', () => {
      const schema = generator.fromMessageStructure(desadvStructure);

      const invalidDesadv = {
        documentNumber: 12345, // should be string!
        documentDate: '20260127',
        parties: []
      };

      const result = validator.validate(invalidDesadv, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'documentNumber')).toBe(true);
    });

    it('should detect maxLength violation', () => {
      const schema = generator.fromMessageStructure(desadvStructure);
      const exceedsMaxLength = 50;

      const invalidDesadv = {
        documentNumber: 'A'.repeat(exceedsMaxLength),
        documentDate: '20260127',
        parties: []
      };

      const result = validator.validate(invalidDesadv, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e =>
        e.field === 'documentNumber' && e.message.includes('maxLength')
      )).toBe(true);
    });

    it('should detect invalid array item', () => {
      const schema = generator.fromMessageStructure(desadvStructure);

      const invalidDesadv = {
        documentNumber: 'DESADV-001',
        documentDate: '20260127',
        parties: [],
        lineItems: [
          {
            // lineNumber missing (required)!
            itemNumber: 'ITEM-001',
            quantity: 100
          }
        ]
      };

      const result = validator.validate(invalidDesadv, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e =>
        e.field === 'lineItems[0].lineNumber' && e.message.includes('Required')
      )).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should generate schema in < 100ms', () => {
      const maxGenerationTimeMs = 100;
      const startTime = Date.now();

      generator.fromMessageStructure(desadvStructure);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(maxGenerationTimeMs);
    });

    it('should validate business object in < 50ms', () => {
      const schema = generator.fromMessageStructure(desadvStructure);
      const maxValidationTimeMs = 50;
      const businessObject = {
        documentNumber: 'DESADV-PERF-001',
        documentDate: '20260127',
        parties: [],
        lineItems: []
      };

      const startTime = Date.now();

      validator.validate(businessObject, schema);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(maxValidationTimeMs);
    });
  });
});
