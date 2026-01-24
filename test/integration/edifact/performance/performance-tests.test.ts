import { describe, it, expect } from 'vitest';
import { generateLargeOrdersMessage } from '../../fixture-loader';
import { ValidationServiceBuilder } from '../../../../src';
import { BuildEDIUseCase } from '../../../../src/application/use-cases/build/BuildEDIUseCase';
import { EdifactMessageParser } from '../../../../src/infrastructure/parsers/edifact/EdifactMessageParser';
import { EdifactSegmentParser } from '../../../../src/infrastructure/parsers/edifact/EdifactSegmentParser';
import { EdifactTokenizer } from '../../../../src/infrastructure/parsers/edifact/EdifactTokenizer';
import { EdifactDelimiterDetector } from '../../../../src/infrastructure/parsers/edifact/EdifactDelimiterDetector';
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
    const result = buildUseCase.execute({ message });
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
    const built = buildUseCase.execute({ message: parsed1 });
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
