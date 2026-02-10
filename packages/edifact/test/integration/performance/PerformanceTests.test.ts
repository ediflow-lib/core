// noinspection NestedFunctionJS

import { Delimiters } from '@ediflow/core';

const edifactDelimiters = Delimiters.custom({ component: ':', element: '+', decimal: '.', escape: '?', segment: "'" });

import { describe, it, expect } from 'vitest';
import { generateLargeOrdersMessage } from '../FixtureLoader';
import { BuildEDIUseCase } from '@ediflow/core';
import { EdifactMessageParser, EdifactValidationServiceBuilder } from '@edifact';
import { EdifactSegmentParser } from '@edifact/infrastructure/parsers/EdifactSegmentParser';
import { EdifactTokenizer } from '@edifact/infrastructure/parsers/EdifactTokenizer';
import { EdifactDelimiterDetector } from '@edifact/infrastructure/parsers/EdifactDelimiterDetector';
import { EdifactMessageBuilder } from '@edifact/infrastructure/builders/EdifactMessageBuilder';

const PERFORMANCE_THRESHOLDS = {
  SEGMENT_COUNT: 1000,
  PARSE_TIME_MS: 100,
  VALIDATE_TIME_MS: 50,
  BUILD_TIME_MS: 100,
  ROUNDTRIP_TIME_MS: 200,
  MIN_OUTPUT_SIZE_BYTES: 50000,
} as const;

describe('Integration: EDIFACT Performance Tests', () => {
  function createParser(): EdifactMessageParser {
    const delimiterDetector = new EdifactDelimiterDetector();
    const tokenizer = new EdifactTokenizer();
    const segmentParser = new EdifactSegmentParser();
    return new EdifactMessageParser(delimiterDetector, tokenizer, segmentParser);
  }

  it('should parse 1000 segments in < 100ms', () => {
    const largeMessage = generateLargeOrdersMessage(PERFORMANCE_THRESHOLDS.SEGMENT_COUNT);
    const start = performance.now();
    const message = createParser().parse(largeMessage);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.PARSE_TIME_MS);
    expect(message.segments.length).toBeGreaterThan(PERFORMANCE_THRESHOLDS.SEGMENT_COUNT);
  });

  it('should validate 1000 segments in < 50ms', () => {
    const largeMessage = generateLargeOrdersMessage(PERFORMANCE_THRESHOLDS.SEGMENT_COUNT);
    const message = createParser().parse(largeMessage);
    const validator = EdifactValidationServiceBuilder.forEDIFACT();
    const start = performance.now();
    const result = validator.validate(message);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.VALIDATE_TIME_MS);
    expect(result.isValid).toBe(true);
  });

  it('should build 1000 segments in < 100ms', () => {
    const largeMessage = generateLargeOrdersMessage(PERFORMANCE_THRESHOLDS.SEGMENT_COUNT);
    const message = createParser().parse(largeMessage);
    const messageBuilder = new EdifactMessageBuilder();
    const buildUseCase = new BuildEDIUseCase(messageBuilder);
    const start = performance.now();
    const result = buildUseCase.execute({ message, delimiters: edifactDelimiters });
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BUILD_TIME_MS);
    expect(result.success).toBe(true);

    if (result.success) {
      const ediString = result.ediString!;
      expect(ediString.length).toBeGreaterThan(PERFORMANCE_THRESHOLDS.MIN_OUTPUT_SIZE_BYTES);
    }
  });

  it('should roundtrip 1000 segments in < 200ms', () => {
    const largeMessage = generateLargeOrdersMessage(PERFORMANCE_THRESHOLDS.SEGMENT_COUNT);
    const parser = createParser();
    const messageBuilder = new EdifactMessageBuilder();
    const buildUseCase = new BuildEDIUseCase(messageBuilder);
    const start = performance.now();
    const parsed1 = parser.parse(largeMessage);
    const built = buildUseCase.execute({ message: parsed1, delimiters: edifactDelimiters });
    if (built.success) {
      const parsed2 = parser.parse(built.ediString!);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.ROUNDTRIP_TIME_MS);
      expect(parsed2.segments.length).toBe(parsed1.segments.length);
    } else {
      throw new Error('Build failed');
    }
  });
});

