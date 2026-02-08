// noinspection NestedFunctionJS

import { describe, it, expect } from 'vitest';
import { loadValidFixture } from '../FixtureLoader';
import { Delimiters } from '@ediflow/core';
import { BuildEDIUseCase } from '@ediflow/core';
import { Standard } from '@ediflow/core';
import { EdifactMessageParser, EdifactValidationServiceBuilder } from '@edifact';
import { EdifactSegmentParser } from '@edifact';
import { EdifactTokenizer } from '@edifact';
import { EdifactDelimiterDetector } from '@edifact';
import { EdifactMessageBuilder } from '@edifact/infrastructure/builders/EdifactMessageBuilder';

const edifactDelimiters = Delimiters.custom({
  component: ':',
  element: '+',
  decimal: '.',
  escape: '?',
  segment: "'",
});

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
      const result = EdifactValidationServiceBuilder.forEDIFACT().validate(message);
      expect(result.isValid).toBe(true);
    });
  });
  describe('Build', () => {
    it('should build to EDI string', () => {
      const message = createParser().parse(ordersFixture);
      const messageBuilder = new EdifactMessageBuilder();
      const result = new BuildEDIUseCase(messageBuilder).execute({ message, delimiters: edifactDelimiters });
      expect(result.success).toBe(true);
      if (result.success) expect(result.ediString).toContain('ORDERS');
    });
  });
  describe('Roundtrip', () => {
    it('should maintain integrity', () => {
      const p1 = createParser().parse(ordersFixture);
      const messageBuilder = new EdifactMessageBuilder();
      const built = new BuildEDIUseCase(messageBuilder).execute({ message: p1, delimiters: edifactDelimiters });
      if (!built.success) return;
      const p2 = createParser().parse(built.ediString);
      expect(p2.messageType.value).toBe(p1.messageType.value);
      expect(p2.segments.length).toBe(p1.segments.length);
    });
  });
});
