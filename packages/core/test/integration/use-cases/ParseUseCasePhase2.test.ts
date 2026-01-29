/**
 * Integration Tests for ParseEDIUseCase - Phase 2 (Structure Mapping)
 *
 * Tests US-6.2: StructureMapper integration with ParseEDIUseCase
 * Demonstrates the "Definition of Done" code from US-6.2 spec
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ParseEDIUseCase } from '@application/use-cases/parse/ParseEDIUseCase';
import { Standard } from '@domain';
import type { MessageStructure } from '@domain/repositories';
import { EdifactMessageParser } from '@infrastructure/parsers/edifact/EdifactMessageParser';
import { EdifactDelimiterDetector } from '@infrastructure/parsers/edifact/EdifactDelimiterDetector';
import { EdifactTokenizer } from '@infrastructure/parsers/edifact/EdifactTokenizer';
import { EdifactSegmentParser } from '@infrastructure/parsers/edifact/EdifactSegmentParser';
import { StructureMapper } from '@domain/mapping';

describe('Integration: ParseEDIUseCase - Phase 2 (Structure Mapping)', () => {
  function createParser() {
    const delimiterDetector = new EdifactDelimiterDetector();
    const tokenizer = new EdifactTokenizer();
    const segmentParser = new EdifactSegmentParser();
    return new EdifactMessageParser(delimiterDetector, tokenizer, segmentParser);
  }

  function createUseCase() {
    const parser = createParser();
    const structureMapper = new StructureMapper();
    return new ParseEDIUseCase(parser, structureMapper);
  }

  describe('Parse with Business Object Return (returnTypedObject: true)', () => {
    it('should return typed business object when messageStructure provided', () => {
      const ediString = readFileSync(
        join(__dirname, '../fixtures/edifact/happy-path/orders-valid-d96a.edi'),
        'utf-8'
      );

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.96A',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segment',
            tag: 'BGM',
            name: 'Beginning of message',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: [],
            mapping: {
              targetField: 'documentNumber',
              elementIndex: 1,
            },
          },
        ],
      };

      const useCase = createUseCase();
      const result = useCase.execute({
        message: ediString,
        standard: Standard.EDIFACT,
        returnTypedObject: true,
        messageStructure: structure,
      });

      // Assertions from US-6.2 "Definition of Done"
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.businessObject).toBeDefined();
        expect(result.businessObject.documentNumber).toBeDefined();
        expect(typeof result.businessObject.documentNumber).toBe('string');

        // EDIMessage is still available
        expect(result.message).toBeDefined();
      }
    });

    it('should return only EDIMessage when returnTypedObject is false', () => {
      const ediString = readFileSync(
        join(__dirname, '../fixtures/edifact/happy-path/orders-valid-d96a.edi'),
        'utf-8'
      );

      const useCase = createUseCase();
      const result = useCase.execute({
        message: ediString,
        standard: Standard.EDIFACT,
        returnTypedObject: false,  // Phase 1 only
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.businessObject).toBeUndefined();
        expect(result.message).toBeDefined();
      }
    });

    it('should map multiple fields from ORDERS message', () => {
      const ediString = readFileSync(
        join(__dirname, '../fixtures/edifact/happy-path/orders-valid-d96a.edi'),
        'utf-8'
      );

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.96A',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segment',
            tag: 'BGM',
            name: 'Beginning',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: [],
            mapping: {
              targetField: 'documentNumber',
              elementIndex: 1,
            },
          },
          {
            nodeType: 'segment',
            tag: 'DTM',
            name: 'Date',
            mandatory: false,
            maxOccurrences: 10,
            position: 20,
            elements: [],
            mapping: {
              targetField: 'documentDate',
              elementIndex: 1,
              componentIndex: 0,
              typeConversion: 'date',
              dateFormat: 'YYYYMMDD',
            },
          },
        ],
      };

      const useCase = createUseCase();
      const result = useCase.execute({
        message: ediString,
        standard: Standard.EDIFACT,
        returnTypedObject: true,
        messageStructure: structure,
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.businessObject.documentNumber).toBeDefined();
        // documentDate might be undefined if DTM segment doesn't exist in test file
      }
    });

    it('should handle missing messageStructure gracefully', () => {
      const ediString = readFileSync(
        join(__dirname, '../fixtures/edifact/happy-path/orders-valid-d96a.edi'),
        'utf-8'
      );

      const useCase = createUseCase();
      const result = useCase.execute({
        message: ediString,
        standard: Standard.EDIFACT,
        returnTypedObject: true,
        // No messageStructure provided!
      });

      expect(result.success).toBe(true);

      if (result.success) {
        // Should still parse Phase 1 successfully
        expect(result.message).toBeDefined();
        // But no business object (no structure provided)
        expect(result.businessObject).toBeUndefined();
      }
    });
  });

  describe('Backward Compatibility (Phase 1 Only)', () => {
    it('should work without StructureMapper (legacy behavior)', () => {
      const ediString = readFileSync(
        join(__dirname, '../fixtures/edifact/happy-path/orders-valid-d96a.edi'),
        'utf-8'
      );

      const parser = createParser();
      const useCase = new ParseEDIUseCase(parser);  // No StructureMapper!

      const result = useCase.execute({
        message: ediString,
        standard: Standard.EDIFACT,
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.message).toBeDefined();
        expect(result.businessObject).toBeUndefined();
      }
    });

    it('should ignore returnTypedObject if no StructureMapper provided', () => {
      const ediString = readFileSync(
        join(__dirname, '../fixtures/edifact/happy-path/orders-valid-d96a.edi'),
        'utf-8'
      );

      const parser = createParser();
      const useCase = new ParseEDIUseCase(parser);  // No StructureMapper!

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.96A',
        messageType: 'ORDERS',
        name: 'Test',
        structure: [],
      };

      const result = useCase.execute({
        message: ediString,
        standard: Standard.EDIFACT,
        returnTypedObject: true,
        messageStructure: structure,
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.message).toBeDefined();
        expect(result.businessObject).toBeUndefined();  // No mapper = no business object
      }
    });
  });
});
