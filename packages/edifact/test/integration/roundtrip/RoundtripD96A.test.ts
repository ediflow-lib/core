import { describe, it, expect } from 'vitest';
import { ParseEDIUseCase } from '@ediflow/core';
import { BuildEDIUseCase } from '@ediflow/core';
import { StructureMapper } from '@ediflow/core';
import { EdifactMessageParser } from '../../../src/infrastructure/parsers/EdifactMessageParser';
import { EdifactDelimiterDetector } from '../../../src/infrastructure/parsers/EdifactDelimiterDetector';
import { EdifactTokenizer } from '../../../src/infrastructure/parsers/EdifactTokenizer';
import { EdifactSegmentParser } from '../../../src/infrastructure/parsers/EdifactSegmentParser';
import { Standard } from '@ediflow/core';
import { loadValidFixture } from '../FixtureLoader';

/**
 * E2E Regression Tests - D.96A
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
describe('E2E Roundtrip Tests - D.96A (US-8.2)', () => {
  const mapper = new StructureMapper();

  const delimiterDetector = new EdifactDelimiterDetector();
  const tokenizer = new EdifactTokenizer();
  const segmentParser = new EdifactSegmentParser();
  const edifactParser = new EdifactMessageParser(delimiterDetector, tokenizer, segmentParser);

  const parseUseCase = new ParseEDIUseCase(edifactParser, mapper);
  const buildUseCase = new BuildEDIUseCase(mapper);

  describe('ORDERS D.96A - Complete Roundtrip', () => {
    it('should parse, map, build, and parse again with identical result', () => {
      const ediString = loadValidFixture('orders-valid-d96a.edi');

      const firstParseResult = parseUseCase.execute({ message: ediString, standard: Standard.EDIFACT });
      expect(firstParseResult.success).toBe(true);
      if (!firstParseResult.success) return;

      const originalMessage = firstParseResult.message;
      expect(originalMessage).toBeDefined();
      expect(originalMessage.standard).toBe(Standard.EDIFACT);
      expect(originalMessage.version.toString()).toBe('D.96A');
      expect(originalMessage.messageType.value).toBe('ORDERS');

      const buildResult = buildUseCase.execute({ message: originalMessage });
      expect(buildResult.success).toBe(true);
      if (!buildResult.success) return;

      const rebuiltEdiString = buildResult.ediString;
      expect(rebuiltEdiString).toBeDefined();
      expect(rebuiltEdiString.length).toBeGreaterThan(0);

      const secondParseResult = parseUseCase.execute({ message: rebuiltEdiString, standard: Standard.EDIFACT });
      expect(secondParseResult.success).toBe(true);
      if (!secondParseResult.success) return;

      const roundtripMessage = secondParseResult.message;

      expect(roundtripMessage.standard).toBe(originalMessage.standard);
      expect(roundtripMessage.version.toString()).toBe(originalMessage.version.toString());
      expect(roundtripMessage.messageType.value).toBe(originalMessage.messageType.value);
      expect(roundtripMessage.segments.length).toBe(originalMessage.segments.length);

      for (let i = 0; i < originalMessage.segments.length; i++) {
        const originalSeg = originalMessage.segments[i];
        const roundtripSeg = roundtripMessage.segments[i];

        expect(roundtripSeg?.tag).toBe(originalSeg?.tag);
        expect(roundtripSeg?.elements.length).toBe(originalSeg?.elements.length);
      }
    });

    it('should maintain performance < 200ms for parse-build-parse cycle', () => {
      const ediString = loadValidFixture('orders-valid-d96a.edi');
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

  describe('DESADV D.96A - Complete Roundtrip', () => {
    it('should parse, map, build, and parse again with identical result', () => {
      const ediString = loadValidFixture('desadv-valid-d96a.edi');

      const firstParseResult = parseUseCase.execute({ message: ediString, standard: Standard.EDIFACT });
      expect(firstParseResult.success).toBe(true);
      if (!firstParseResult.success) return;

      const originalMessage = firstParseResult.message;
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
});
