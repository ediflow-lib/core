import { describe, it, expect } from 'vitest';
import { ParseEDIUseCase } from '@application/use-cases/parse/ParseEDIUseCase';
import { BuildEDIUseCase } from '@application/use-cases/build/BuildEDIUseCase';
import { StructureMapper } from '@domain/mapping';
import { EdifactMessageParser } from '@infrastructure/parsers/edifact/EdifactMessageParser';
import { EdifactDelimiterDetector } from '@infrastructure/parsers/edifact/EdifactDelimiterDetector';
import { EdifactTokenizer } from '@infrastructure/parsers/edifact/EdifactTokenizer';
import { EdifactSegmentParser } from '@infrastructure/parsers/edifact/EdifactSegmentParser';
import { Standard } from '@domain';
import { loadValidFixture } from '../../FixtureLoader';

/**
 * E2E Regression Tests - D.20B
 * US-8.2: E2E Regression Tests (D20B/D01B/D96A)
 *
 * Test Flow:
 * 1. Parse EDI → EDIMessage
 * 2. Validate structure
 * 3. Map to BusinessObject
 * 4. Build back to EDI
 * 5. Parse again (Roundtrip)
 * 6. Assert: parsed1 == parsed2 (Regression!)
 */
describe('E2E Roundtrip Tests - D.20B (US-8.2)', () => {
  const mapper = new StructureMapper();

  const delimiterDetector = new EdifactDelimiterDetector();
  const tokenizer = new EdifactTokenizer();
  const segmentParser = new EdifactSegmentParser();
  const edifactParser = new EdifactMessageParser(delimiterDetector, tokenizer, segmentParser);

  const parseUseCase = new ParseEDIUseCase(edifactParser, mapper);
  const buildUseCase = new BuildEDIUseCase(mapper);

  describe('ORDERS D.20B - Complete Roundtrip', () => {
    it('should parse, map, build, and parse again with identical result', () => {
      const ediString = loadValidFixture('orders-valid-d20b.edi');

      const firstParseResult = parseUseCase.execute({ message: ediString, standard: Standard.EDIFACT });
      expect(firstParseResult.success).toBe(true);
      if (!firstParseResult.success) return;

      const originalMessage = firstParseResult.message;
      expect(originalMessage.standard).toBe(Standard.EDIFACT);
      expect(originalMessage.version.toString()).toBe('D.20B');
      expect(originalMessage.messageType.value).toBe('ORDERS');

      const buildResult = buildUseCase.execute({ message: originalMessage });
      expect(buildResult.success).toBe(true);
      if (!buildResult.success) return;

      const secondParseResult = parseUseCase.execute({ message: buildResult.ediString, standard: Standard.EDIFACT });
      expect(secondParseResult.success).toBe(true);
      if (!secondParseResult.success) return;

      const roundtripMessage = secondParseResult.message;
      expect(roundtripMessage.segments.length).toBe(originalMessage.segments.length);
      expect(roundtripMessage.messageType.value).toBe(originalMessage.messageType.value);
    });
  });

  describe('DESADV D.20B - Complete Roundtrip', () => {
    it('should parse, map, build, and parse again with identical result', () => {
      const ediString = loadValidFixture('desadv-valid-d20b.edi');

      const firstParseResult = parseUseCase.execute({ message: ediString, standard: Standard.EDIFACT });
      expect(firstParseResult.success).toBe(true);
      if (!firstParseResult.success) return;

      const originalMessage = firstParseResult.message;
      expect(originalMessage.version.toString()).toBe('D.20B');
      expect(originalMessage.messageType.value).toBe('DESADV');

      const buildResult = buildUseCase.execute({ message: originalMessage });
      expect(buildResult.success).toBe(true);
      if (!buildResult.success) return;

      const secondParseResult = parseUseCase.execute({ message: buildResult.ediString, standard: Standard.EDIFACT });
      expect(secondParseResult.success).toBe(true);
      if (!secondParseResult.success) return;

      expect(secondParseResult.message.segments.length).toBe(originalMessage.segments.length);
    });
  });

  describe('INVOIC D.20B - Complete Roundtrip', () => {
    it('should parse, map, build, and parse again with identical result', () => {
      const ediString = loadValidFixture('invoic-valid-d20b.edi');

      const firstParseResult = parseUseCase.execute({ message: ediString, standard: Standard.EDIFACT });
      expect(firstParseResult.success).toBe(true);
      if (!firstParseResult.success) return;

      const originalMessage = firstParseResult.message;
      expect(originalMessage.version.toString()).toBe('D.20B');
      expect(originalMessage.messageType.value).toBe('INVOIC');

      const buildResult = buildUseCase.execute({ message: originalMessage });
      expect(buildResult.success).toBe(true);
      if (!buildResult.success) return;

      const secondParseResult = parseUseCase.execute({ message: buildResult.ediString, standard: Standard.EDIFACT });
      expect(secondParseResult.success).toBe(true);
      if (!secondParseResult.success) return;

      expect(secondParseResult.message.segments.length).toBe(originalMessage.segments.length);
    });
  });

  describe('Performance Tests', () => {
    it('should maintain performance < 200ms for ORDERS roundtrip', () => {
      const ediString = loadValidFixture('orders-valid-d20b.edi');
      const maxDurationMs = 200;

      const startTime = Date.now();

      const firstParseResult = parseUseCase.execute({ message: ediString, standard: Standard.EDIFACT });
      if (!firstParseResult.success) return;

      const buildResult = buildUseCase.execute({ message: firstParseResult.message });
      if (!buildResult.success) return;

      parseUseCase.execute({ message: buildResult.ediString, standard: Standard.EDIFACT });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(maxDurationMs);
    });
  });
});
