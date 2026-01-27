﻿import { describe, it, expect } from 'vitest';
import { loadInvalidFixture } from '../../FixtureLoader';
import { ValidationServiceBuilder } from '@application/services';
import { EDIMessage, EDISegment, Standard, Version, MessageType } from '@domain';
import { EdifactMessageParser } from '@infrastructure/parsers/edifact/EdifactMessageParser';
import { EdifactSegmentParser } from '@infrastructure/parsers/edifact/EdifactSegmentParser';
import { EdifactTokenizer } from '@infrastructure/parsers/edifact/EdifactTokenizer';
import { EdifactDelimiterDetector } from '@infrastructure/parsers/edifact/EdifactDelimiterDetector';

describe('Integration: EDIFACT Negative Tests', () => {
  function createParser(): EdifactMessageParser {
    const delimiterDetector = new EdifactDelimiterDetector();
    const tokenizer = new EdifactTokenizer();
    const segmentParser = new EdifactSegmentParser();
    return new EdifactMessageParser(delimiterDetector, tokenizer, segmentParser);
  }
  it('should fail when UNH segment is missing', () => {
    const invalid = loadInvalidFixture('missing-unh.edi');
    expect(() => createParser().parse(invalid)).toThrow();
  });
  it('should fail validation when UNB segment is missing', () => {
    const invalid = loadInvalidFixture('missing-unb.edi');
    const message = createParser().parse(invalid);
    const result = ValidationServiceBuilder.forEDIFACT().validate(message);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'INVALID_FIRST_SEGMENT')).toBe(true);
  });
  it('should fail validation when UNZ is not last', () => {
    const message = createParser().parse(loadInvalidFixture('invalid-segment-order.edi'));
    const result = ValidationServiceBuilder.forEDIFACT().validate(message);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'INVALID_LAST_SEGMENT')).toBe(true);
  });
  it('should fail when segment tag has invalid characters', () => {
    const message = new EDIMessage(
      Standard.EDIFACT,
      new Version(Standard.EDIFACT, 'D.96A'),
      new MessageType(Standard.EDIFACT, 'ORDERS')
    );
    message.addSegment(new EDISegment('UNB', []));
    message.addSegment(new EDISegment('unh', []));
    message.addSegment(new EDISegment('UNZ', []));
    const result = ValidationServiceBuilder.forEDIFACT().validate(message);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'INVALID_SEGMENT_TAG')).toBe(true);
  });
  it('should fail when message has no segments', () => {
    const message = new EDIMessage(
      Standard.EDIFACT,
      new Version(Standard.EDIFACT, 'D.96A'),
      new MessageType(Standard.EDIFACT, 'ORDERS')
    );
    const result = ValidationServiceBuilder.forEDIFACT().validate(message);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'EMPTY_MESSAGE')).toBe(true);
  });
});
