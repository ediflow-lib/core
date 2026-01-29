import { describe, it, expect } from 'vitest';
import { loadValidFixture } from '../../FixtureLoader';
import { ValidationServiceBuilder } from '@application/services';
import { BuildEDIUseCase } from '@application/use-cases/build/BuildEDIUseCase';
import { Standard } from '@domain';
import { EdifactMessageParser } from '@infrastructure/parsers/edifact/EdifactMessageParser';
import { EdifactSegmentParser } from '@infrastructure/parsers/edifact/EdifactSegmentParser';
import { EdifactTokenizer } from '@infrastructure/parsers/edifact/EdifactTokenizer';
import { EdifactDelimiterDetector } from '@infrastructure/parsers/edifact/EdifactDelimiterDetector';
describe('Integration: EDIFACT ORDERS D.96A (Happy Path)', () => {
  const ordersFixture = loadValidFixture('orders-valid-d96a.edi');
  function createParser(): EdifactMessageParser {
    const delimiterDetector = new EdifactDelimiterDetector();
    const tokenizer = new EdifactTokenizer();
    const segmentParser = new EdifactSegmentParser();
    return new EdifactMessageParser(delimiterDetector, tokenizer, segmentParser);
  }
  describe('Parse', () => {
    it('should parse valid ORDERS message', () => {
      const message = createParser().parse(ordersFixture);
      expect(message.standard).toBe(Standard.EDIFACT);
      expect(message.version.value).toBe('D.96A');
      expect(message.messageType.value).toBe('ORDERS');
      expect(message.segments.length).toBeGreaterThan(4);
    });
    it('should parse all segments', () => {
      const message = createParser().parse(ordersFixture);
      const tags = message.segments.map(s => s.tag);
      expect(tags).toContain('UNB');
      expect(tags).toContain('UNH');
      expect(tags).toContain('UNZ');
    });
  });
  describe('Validate', () => {
    it('should validate successfully', () => {
      const message = createParser().parse(ordersFixture);
      const result = ValidationServiceBuilder.forEDIFACT().validate(message);
      expect(result.isValid).toBe(true);
    });
  });
  describe('Build', () => {
    it('should build to EDI string', () => {
      const message = createParser().parse(ordersFixture);
      const result = new BuildEDIUseCase().execute({ message });
      expect(result.success).toBe(true);
      if (result.success) expect(result.ediString).toContain('ORDERS');
    });
  });
  describe('Roundtrip', () => {
    it('should maintain integrity', () => {
      const p1 = createParser().parse(ordersFixture);
      const built = new BuildEDIUseCase().execute({ message: p1 });
      if (!built.success) return;
      const p2 = createParser().parse(built.ediString);
      expect(p2.messageType.value).toBe(p1.messageType.value);
      expect(p2.segments.length).toBe(p1.segments.length);
    });
  });
});
