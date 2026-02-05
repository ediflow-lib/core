import { Delimiters } from '@ediflow/core';

const edifactDelimiters = Delimiters.custom({ component: ':', element: '+', decimal: '.', escape: '?', segment: "'" });

import { describe, it, expect } from 'vitest';
import { generateLargeOrdersMessage } from '../FixtureLoader';
import { ValidationServiceBuilder } from '@ediflow/core';
import { BuildEDIUseCase } from '@ediflow/core';
import { EdifactMessageParser } from '../../../src/infrastructure/parsers/EdifactMessageParser';
import { EdifactSegmentParser } from '../../../src/infrastructure/parsers/EdifactSegmentParser';
import { EdifactTokenizer } from '../../../src/infrastructure/parsers/EdifactTokenizer';
import { EdifactDelimiterDetector } from '../../../src/infrastructure/parsers/EdifactDelimiterDetector';
describe('Integration: EDIFACT Performance Tests', () => {
  function createParser(): EdifactMessageParser {
    const delimiterDetector = new EdifactDelimiterDetector();
    const tokenizer = new EdifactTokenizer();
    const segmentParser = new EdifactSegmentParser();
    return new EdifactMessageParser(delimiterDetector, tokenizer, segmentParser);
  }
  it('should parse 1000 segments in < 100ms', () => {
    const largeMessage = generateLargeOrdersMessage(1000);
    const start = performance.now();
    const message = createParser().parse(largeMessage);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
    expect(message.segments.length).toBeGreaterThan(1000);
  });
  it('should validate 1000 segments in < 50ms', () => {
    const largeMessage = generateLargeOrdersMessage(1000);
    const message = createParser().parse(largeMessage);
    const validator = ValidationServiceBuilder.forEDIFACT();
    const start = performance.now();
    const result = validator.validate(message);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
    expect(result.isValid).toBe(true);
  });
  it('should build 1000 segments in < 100ms', () => {
    const largeMessage = generateLargeOrdersMessage(1000);
    const message = createParser().parse(largeMessage);
    const buildUseCase = new BuildEDIUseCase();
    const start = performance.now();
    const result = buildUseCase.execute({ message, delimiters: edifactDelimiters });
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
    expect(result.success).toBe(true);

    if (result.success) {
      const ediString = result.ediString!; // Non-null assertion: ediString is guaranteed when success=true
      expect(ediString.length).toBeGreaterThan(50000);
    }
  });
  it('should roundtrip 1000 segments in < 200ms', () => {
    const largeMessage = generateLargeOrdersMessage(1000);
    const parser = createParser();
    const buildUseCase = new BuildEDIUseCase();
    const start = performance.now();
    const parsed1 = parser.parse(largeMessage);
    const built = buildUseCase.execute({ message: parsed1, delimiters: edifactDelimiters });
    if (built.success) {
      const parsed2 = parser.parse(built.ediString!); // Non-null assertion: ediString is guaranteed when success=true
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(200);
      expect(parsed2.segments.length).toBe(parsed1.segments.length);
    } else {
      throw new Error('Build failed');
    }
  });
});

