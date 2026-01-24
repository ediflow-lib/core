import { describe, it, expect } from 'vitest';
import { loadValidFixture } from '../../fixture-loader';
import { ParseEDIUseCase } from '../../../../src/application/use-cases/parse/ParseEDIUseCase';
import { BuildEDIUseCase } from '../../../../src/application/use-cases/build/BuildEDIUseCase';
import { ValidationServiceBuilder } from '../../../../src/application/services';
import { Standard } from '../../../../src/domain';
import { EdifactMessageParser } from '../../../../src/infrastructure/parsers/edifact/EdifactMessageParser';
import { EdifactSegmentParser } from '../../../../src/infrastructure/parsers/edifact/EdifactSegmentParser';
import { EdifactTokenizer } from '../../../../src/infrastructure/parsers/edifact/EdifactTokenizer';
import { EdifactDelimiterDetector } from '../../../../src/infrastructure/parsers/edifact/EdifactDelimiterDetector';

/**
 * Integration Tests: EDIFACT ORDERS D.96A - Happy Path
 *
 * Tests the complete flow: Parse → Validate → Build → Roundtrip
 * Uses real EDIFACT samples from fixtures.
 */

describe('Integration: EDIFACT ORDERS D.96A (Happy Path)', () => {
  const ordersFixture = loadValidFixture('orders-valid-d96a.edi');

  describe('Parse', () => {
    it('should parse valid ORDERS message successfully', () => {
      // GIVEN: Real EDIFACT ORDERS message
      expect(ordersFixture).toBeTruthy();
      expect(ordersFixture).toContain('ORDERS');

      // WHEN: Parse using ParseEDIUseCase
      const delimiterDetector = new EdifactDelimiterDetector();
      const tokenizer = new EdifactTokenizer(delimiterDetector);
      const segmentParser = new EdifactSegmentParser();
      const messageParser = new EdifactMessageParser(tokenizer, segmentParser);

      const parseUseCase = new ParseEDIUseCase(messageParser);
      const result = parseUseCase.execute({ message: ordersFixture, standard: Standard.EDIFACT });

      // THEN: Should parse successfully
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();

      if (result.success) {
        expect(result.message.standard).toBe(Standard.EDIFACT);
        expect(result.message.version.value).toBe('D.96A');
        expect(result.message.messageType.value).toBe('ORDERS');
        expect(result.message.segments.length).toBeGreaterThan(4);
      }
    });

    it('should parse all mandatory segments correctly', () => {
      // GIVEN: Parsed ORDERS message
      const delimiterDetector = new EdifactDelimiterDetector();
      const tokenizer = new EdifactTokenizer(delimiterDetector);
      const segmentParser = new EdifactSegmentParser();
      const messageParser = new EdifactMessageParser(tokenizer, segmentParser);

      const parseUseCase = new ParseEDIUseCase(messageParser);
      const result = parseUseCase.execute({ message: ordersFixture, standard: Standard.EDIFACT });

      // WHEN: Check segment tags
      expect(result.success).toBe(true);

      if (result.success) {
        const segmentTags = result.message.segments.map(s => s.tag);

        // THEN: Should have all mandatory EDIFACT segments
        expect(segmentTags).toContain('UNB'); // Interchange header
        expect(segmentTags).toContain('UNH'); // Message header
        expect(segmentTags).toContain('BGM'); // Beginning of message
        expect(segmentTags).toContain('UNT'); // Message trailer
        expect(segmentTags).toContain('UNZ'); // Interchange trailer
      }
    });

    it('should parse all business segments correctly', () => {
      // GIVEN: Parsed ORDERS message
      const delimiterDetector = new EdifactDelimiterDetector();
      const tokenizer = new EdifactTokenizer(delimiterDetector);
      const segmentParser = new EdifactSegmentParser();
      const messageParser = new EdifactMessageParser(tokenizer, segmentParser);

      const parseUseCase = new ParseEDIUseCase(messageParser);
      const result = parseUseCase.execute({ message: ordersFixture, standard: Standard.EDIFACT });

      // WHEN: Check business segments
      expect(result.success).toBe(true);

      if (result.success) {
        const segmentTags = result.message.segments.map(s => s.tag);

        // THEN: Should have business data segments
        expect(segmentTags).toContain('DTM'); // Date/Time
        expect(segmentTags).toContain('NAD'); // Name and Address
        expect(segmentTags).toContain('LIN'); // Line Item
        expect(segmentTags).toContain('QTY'); // Quantity
        expect(segmentTags).toContain('PRI'); // Price
      }
    });
  });

  describe('Validate', () => {
    it('should validate ORDERS message successfully', () => {
      // GIVEN: Parsed ORDERS message
      const delimiterDetector = new EdifactDelimiterDetector();
      const tokenizer = new EdifactTokenizer(delimiterDetector);
      const segmentParser = new EdifactSegmentParser();
      const messageParser = new EdifactMessageParser(tokenizer, segmentParser);

      const parseUseCase = new ParseEDIUseCase(messageParser);
      const parseResult = parseUseCase.execute({ message: ordersFixture, standard: Standard.EDIFACT });

      expect(parseResult.success).toBe(true);

      if (!parseResult.success) {
        throw new Error('Parse failed');
      }

      // WHEN: Validate with EDIFACT rules
      const validator = ValidationServiceBuilder.forEDIFACT();
      const validationResult = validator.validate(parseResult.message);

      // THEN: Should pass all validation rules
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });

    it('should pass all EDIFACT validation rules', () => {
      // GIVEN: Parsed ORDERS message
      const delimiterDetector = new EdifactDelimiterDetector();
      const tokenizer = new EdifactTokenizer(delimiterDetector);
      const segmentParser = new EdifactSegmentParser();
      const messageParser = new EdifactMessageParser(tokenizer, segmentParser);

      const parseUseCase = new ParseEDIUseCase(messageParser);
      const parseResult = parseUseCase.execute({ message: ordersFixture, standard: Standard.EDIFACT });

      expect(parseResult.success).toBe(true);

      if (!parseResult.success) {
        throw new Error('Parse failed');
      }

      // WHEN: Validate
      const validator = ValidationServiceBuilder.forEDIFACT();
      const validationResult = validator.validate(parseResult.message);

      // THEN: Validation rules applied:
      // ✅ MessageMustHaveSegmentsRule - message has segments
      // ✅ VersionStandardMustMatchRule - EDIFACT = EDIFACT
      // ✅ MessageTypeStandardMustMatchRule - EDIFACT = EDIFACT
      // ✅ UNBMustBeFirstRule - UNB is first segment
      // ✅ UNZMustBeLastRule - UNZ is last segment
      // ✅ EDIFACTSegmentTagFormatRule - all tags are 3 uppercase letters

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });
  });

  describe('Build', () => {
    it('should build ORDERS message back to EDI string', () => {
      // GIVEN: Parsed EDIMessage object
      const delimiterDetector = new EdifactDelimiterDetector();
      const tokenizer = new EdifactTokenizer(delimiterDetector);
      const segmentParser = new EdifactSegmentParser();
      const messageParser = new EdifactMessageParser(tokenizer, segmentParser);

      const parseUseCase = new ParseEDIUseCase(messageParser);
      const parseResult = parseUseCase.execute({ message: ordersFixture, standard: Standard.EDIFACT });

      expect(parseResult.success).toBe(true);

      if (!parseResult.success) {
        throw new Error('Parse failed');
      }

      // WHEN: Build to EDI string
      const buildUseCase = new BuildEDIUseCase();
      const buildResult = buildUseCase.execute({ message: parseResult.message });

      // THEN: Should produce valid EDI string
      expect(buildResult.success).toBe(true);

      if (buildResult.success) {
        expect(buildResult.ediString).toContain("UNB+");
        expect(buildResult.ediString).toContain("ORDERS");
        expect(buildResult.ediString).toContain("D:96A");
        expect(buildResult.ediString).toContain("UNZ+");

        // Should have proper segment terminators
        expect(buildResult.ediString).toContain("'");
      }
    });

    it('should build with correct EDIFACT delimiters', () => {
      // GIVEN: Parsed message
      const delimiterDetector = new EdifactDelimiterDetector();
      const tokenizer = new EdifactTokenizer(delimiterDetector);
      const segmentParser = new EdifactSegmentParser();
      const messageParser = new EdifactMessageParser(tokenizer, segmentParser);

      const parseUseCase = new ParseEDIUseCase(messageParser);
      const parseResult = parseUseCase.execute({ message: ordersFixture, standard: Standard.EDIFACT });

      expect(parseResult.success).toBe(true);

      if (!parseResult.success) {
        throw new Error('Parse failed');
      }

      // WHEN: Build
      const buildUseCase = new BuildEDIUseCase();
      const buildResult = buildUseCase.execute({ message: parseResult.message });

      // THEN: Should use EDIFACT delimiters
      expect(buildResult.success).toBe(true);

      if (buildResult.success) {
        // Component delimiter: :
        // Element delimiter: +
        // Segment terminator: '
        expect(buildResult.ediString).toMatch(/UNH\+\d+\+ORDERS:D:96A:UN/);
        expect(buildResult.ediString).toMatch(/BGM\+\d+\+[^']+'/);
      }
    });
  });

  describe('Roundtrip', () => {
    it('should maintain data integrity in roundtrip (parse → build → parse)', () => {
      // GIVEN: Original EDI string
      const original = ordersFixture;

      const delimiterDetector = new EdifactDelimiterDetector();
      const tokenizer = new EdifactTokenizer(delimiterDetector);
      const segmentParser = new EdifactSegmentParser();
      const messageParser = new EdifactMessageParser(tokenizer, segmentParser);

      const parseUseCase = new ParseEDIUseCase(messageParser);
      const buildUseCase = new BuildEDIUseCase();

      // WHEN: Parse → Build → Parse
      const parsed1Result = parseUseCase.execute({ message: original });
      expect(parsed1Result.success).toBe(true);

      if (!parsed1Result.success) {
        throw new Error('First parse failed');
      }

      const builtResult = buildUseCase.execute({ message: parsed1Result.message });
      expect(builtResult.success).toBe(true);

      if (!builtResult.success) {
        throw new Error('Build failed');
      }

      const parsed2Result = parseUseCase.execute({ message: builtResult.ediString });
      expect(parsed2Result.success).toBe(true);

      if (!parsed2Result.success) {
        throw new Error('Second parse failed');
      }

      // THEN: Should have same structure
      expect(parsed2Result.message.messageType.value).toBe(parsed1Result.message.messageType.value);
      expect(parsed2Result.message.version.value).toBe(parsed1Result.message.version.value);
      expect(parsed2Result.message.standard).toBe(parsed1Result.message.standard);
      expect(parsed2Result.message.segments.length).toBe(parsed1Result.message.segments.length);
    });

    it('should maintain segment data in roundtrip', () => {
      // GIVEN: Original message
      const delimiterDetector = new EdifactDelimiterDetector();
      const tokenizer = new EdifactTokenizer(delimiterDetector);
      const segmentParser = new EdifactSegmentParser();
      const messageParser = new EdifactMessageParser(tokenizer, segmentParser);

      const parseUseCase = new ParseEDIUseCase(messageParser);
      const buildUseCase = new BuildEDIUseCase();

      // WHEN: Parse → Build → Parse
      const parsed1Result = parseUseCase.execute({ message: ordersFixture, standard: Standard.EDIFACT });
      expect(parsed1Result.success).toBe(true);

      if (!parsed1Result.success) throw new Error('Parse 1 failed');

      const builtResult = buildUseCase.execute({ message: parsed1Result.message });
      expect(builtResult.success).toBe(true);

      if (!builtResult.success) throw new Error('Build failed');

      const parsed2Result = parseUseCase.execute({ message: builtResult.ediString });
      expect(parsed2Result.success).toBe(true);

      if (!parsed2Result.success) throw new Error('Parse 2 failed');

      // THEN: Segment data should match
      parsed1Result.message.segments.forEach((seg1, idx) => {
        const seg2 = parsed2Result.message.segments[idx];
        expect(seg2).toBeDefined();
        expect(seg2?.tag).toBe(seg1.tag);
        expect(seg2?.elements.length).toBe(seg1.elements.length);
      });
    });
  });
});
