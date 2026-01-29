/**
 * Integration Tests for BuildEDIUseCase - Phase 2 (Structure Unmapping)
 *
 * Tests US-6.2: StructureMapper integration with BuildEDIUseCase
 * Demonstrates building EDI from business objects (reverse mapping)
 */

import {describe, expect, it} from 'vitest';
import {BuildEDIUseCase} from '@application/use-cases/build/BuildEDIUseCase';
import {EDIElement, EDIMessage, EDISegment, MessageType, Standard, Version} from '@domain';
import type {MessageStructure} from '@domain/repositories';
import {StructureMapper} from '@domain/mapping';

describe('Integration: BuildEDIUseCase - Phase 2 (Structure Unmapping)', () => {
  function createUseCase() {
    const structureMapper = new StructureMapper();
    return new BuildEDIUseCase(structureMapper);
  }

  describe('Build from Business Object', () => {
    it('should build EDI message from business object', () => {
      const businessObject = {
        documentNumber: 'PO123456',
      };

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
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
        businessObject,
        messageStructure: structure,
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.ediString).toBeDefined();
        expect(result.ediString).toContain('BGM');
        expect(result.ediString).toContain('PO123456');
      }
    });

    it('should handle multiple fields in business object', () => {
      const businessObject = {
        documentNumber: 'PO123456',
        documentDate: new Date('2026-01-27'),
      };

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
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
            maxOccurrences: 1,
            position: 20,
            elements: [],
            mapping: {
              targetField: 'documentDate',
              elementIndex: 0,
              typeConversion: 'date',
              dateFormat: 'YYYYMMDD',
            },
          },
        ],
      };

      const useCase = createUseCase();
      const result = useCase.execute({
        businessObject,
        messageStructure: structure,
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.ediString).toContain('BGM');
        expect(result.ediString).toContain('PO123456');
        expect(result.ediString).toContain('DTM');
        expect(result.ediString).toContain('20260127');  // Date formatted as YYYYMMDD
      }
    });

    it('should handle arrays in business object (multiple occurrences)', () => {
      const businessObject = {
        parties: ['1234567890', '0987654321'],
      };

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Purchase order',
        structure: [
          {
            nodeType: 'segment',
            tag: 'NAD',
            name: 'Party',
            mandatory: false,
            maxOccurrences: 99,
            position: 30,
            elements: [],
            mapping: {
              targetField: 'parties',
              elementIndex: 1,
              isArray: true,
            },
          },
        ],
      };

      const useCase = createUseCase();
      const result = useCase.execute({
        businessObject,
        messageStructure: structure,
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.ediString).toContain('NAD');
        expect(result.ediString).toContain('1234567890');
        expect(result.ediString).toContain('0987654321');

        // Should have 2 NAD segments
        const nadCount = (result.ediString.match(/NAD/g) || []).length;
        expect(nadCount).toBe(2);
      }
    });

    it('should return error if neither message nor businessObject provided', () => {
      const useCase = createUseCase();
      const result = useCase.execute({
        // No message, no businessObject!
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.errors[0]?.code).toBe('MISSING_INPUT');
      }
    });

    it('should return error if businessObject provided without messageStructure', () => {
      const businessObject = {
        documentNumber: 'PO123',
      };

      const useCase = createUseCase();
      const result = useCase.execute({
        businessObject,
        // No messageStructure!
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.errors[0]?.code).toBe('MISSING_INPUT');
      }
    });
  });

  describe('Backward Compatibility (Direct EDIMessage)', () => {
    it('should still work with direct EDIMessage input (legacy behavior)', () => {

      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      const bgm = new EDISegment('BGM', [
        new EDIElement('220', []),
        new EDIElement('PO123', []),
      ]);
      message.addSegment(bgm);

      const useCase = createUseCase();
      const result = useCase.execute({
        message,  // Direct EDIMessage (existing behavior)
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.ediString).toContain('BGM');
        expect(result.ediString).toContain('PO123');
      }
    });

    it('should work without StructureMapper (legacy)', () => {

      const message = new EDIMessage(
        Standard.EDIFACT,
        new Version(Standard.EDIFACT, 'D.20B'),
        new MessageType(Standard.EDIFACT, 'ORDERS')
      );

      const bgm = new EDISegment('BGM', [
        new EDIElement('220', []),
        new EDIElement('PO123', []),
      ]);
      message.addSegment(bgm);

      const useCase = new BuildEDIUseCase();  // No StructureMapper!
      const result = useCase.execute({
        message,
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.ediString).toBeDefined();
      }
    });
  });

  describe('Segment Creation Verification', () => {
    // NOTE: Full roundtrip requires UNB/UNH envelope headers which will be generated by
    // EnvelopeBuilder (future story, likely Sprint 7-8 for FR-003 Building Phase 2)
    // For now, we verify that segments are correctly created from business object

    it('should create correct segments from business object', () => {
      const businessObject = {
        documentNumber: 'PO999',
        quantity: 100,
      };

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
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
            tag: 'QTY',
            name: 'Quantity',
            mandatory: false,
            maxOccurrences: 1,
            position: 20,
            elements: [],
            mapping: {
              targetField: 'quantity',
              elementIndex: 1,
              typeConversion: 'number',
            },
          },
        ],
      };

      const buildUseCase = createUseCase();
      const buildResult = buildUseCase.execute({
        businessObject,
        messageStructure: structure,
      });

      expect(buildResult.success).toBe(true);

      if (buildResult.success) {
        const ediString = buildResult.ediString;

        // Verify BGM segment with correct position and value
        expect(ediString).toContain('BGM');
        expect(ediString).toContain('PO999');

        // Verify QTY segment with number converted to string
        expect(ediString).toContain('QTY');
        expect(ediString).toContain('100');

        // Verify segment order (BGM before QTY)
        const bgmIndex = ediString.indexOf('BGM');
        const qtyIndex = ediString.indexOf('QTY');
        expect(bgmIndex).toBeLessThan(qtyIndex);

        // Verify segments are separated by segment delimiter (')
        expect(ediString).toMatch(/BGM.*'.*QTY/);
      }
    });

    it('should correctly map date to YYYYMMDD format in segment', () => {
      const businessObject = {
        documentDate: new Date('2026-01-27'),
      };

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
        structure: [
          {
            nodeType: 'segment',
            tag: 'DTM',
            name: 'Date',
            mandatory: true,
            maxOccurrences: 1,
            position: 10,
            elements: [],
            mapping: {
              targetField: 'documentDate',
              elementIndex: 0,
              typeConversion: 'date',
              dateFormat: 'YYYYMMDD',
            },
          },
        ],
      };

      const buildUseCase = createUseCase();
      const result = buildUseCase.execute({
        businessObject,
        messageStructure: structure,
      });

      expect(result.success).toBe(true);

      if (result.success) {
        // Verify date is formatted as YYYYMMDD
        expect(result.ediString).toContain('20260127');
        expect(result.ediString).toContain('DTM');
      }
    });

    it('should use StructureMapper to map business object to EDIMessage', () => {
      // This test verifies the integration: BusinessObject → StructureMapper.unmap() → EDIMessage
      const businessObject = {
        documentNumber: 'TEST123',
      };

      const structure: MessageStructure = {
        standard: 'EDIFACT',
        version: 'D.20B',
        messageType: 'ORDERS',
        name: 'Test',
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
        ],
      };

      const mapper = new StructureMapper();
      const ediMessage = mapper.unmap(businessObject, structure);

      // Verify EDIMessage was created with correct properties
      expect(ediMessage.standard).toBe(Standard.EDIFACT);
      expect(ediMessage.segments).toHaveLength(1);
      expect(ediMessage.segments[0]?.tag).toBe('BGM');
      expect(ediMessage.segments[0]?.elements[1]?.value).toBe('TEST123');
    });
  });
});
