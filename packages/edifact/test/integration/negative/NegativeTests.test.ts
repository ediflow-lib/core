import { describe, it, expect, beforeEach } from 'vitest';
import { loadInvalidFixture } from '../FixtureLoader';
import { EDIMessage, EDISegment, Standard, Version, MessageType } from '@ediflow/core';
import {
  EdifactMessageParser,
  EdifactSegmentParser,
  EdifactTokenizer,
  EdifactDelimiterDetector,
  EdifactValidationServiceBuilder
} from '@edifact';

describe('Integration: EDIFACT Negative Tests', () => {
  let parser: EdifactMessageParser;

  beforeEach(() => {
    const delimiterDetector = new EdifactDelimiterDetector();
    const tokenizer = new EdifactTokenizer();
    const segmentParser = new EdifactSegmentParser();
    parser = new EdifactMessageParser(delimiterDetector, tokenizer, segmentParser);
  });

  it('should fail when UNH segment is missing', () => {
    const invalid = loadInvalidFixture('missing-unh.edi');
    expect(() => parser.parse(invalid)).toThrow();
  });

  it('should fail validation when UNB segment is missing', () => {
    const invalid = loadInvalidFixture('missing-unb.edi');
    const message = parser.parse(invalid);
    const result = EdifactValidationServiceBuilder.forEDIFACT().validate(message);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'INVALID_FIRST_SEGMENT')).toBe(true);
  });

  it('should fail validation when UNZ is not last', () => {
    const message = parser.parse(loadInvalidFixture('invalid-segment-order.edi'));
    const result = EdifactValidationServiceBuilder.forEDIFACT().validate(message);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'INVALID_LAST_SEGMENT')).toBe(true);
  });
  it('should fail when segment tag has invalid characters', () => {
    const message = new EDIMessage('test-id', Standard.EDIFACT,
      new Version(Standard.EDIFACT, 'D.96A'),
      new MessageType(Standard.EDIFACT, 'ORDERS')
    );
    message.addSegment(new EDISegment('UNB', []));
    message.addSegment(new EDISegment('unh', []));
    message.addSegment(new EDISegment('UNZ', []));
    const result = EdifactValidationServiceBuilder.forEDIFACT().validate(message);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'INVALID_SEGMENT_TAG')).toBe(true);
  });
  it('should fail when message has no segments', () => {
    const message = new EDIMessage('test-id', Standard.EDIFACT,
      new Version(Standard.EDIFACT, 'D.96A'),
      new MessageType(Standard.EDIFACT, 'ORDERS')
    );
    const result = EdifactValidationServiceBuilder.forEDIFACT().validate(message);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'EMPTY_MESSAGE')).toBe(true);
  });
});
