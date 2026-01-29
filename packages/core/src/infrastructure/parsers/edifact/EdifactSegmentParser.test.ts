import { describe, it, expect, beforeEach } from 'vitest';
import { EdifactSegmentParser } from './EdifactSegmentParser';
import { Delimiters } from '@domain/value-objects/Delimiters';
import { EDISegment } from '@domain/entities/EDISegment';

describe('EdifactSegmentParser', () => {
  let parser: EdifactSegmentParser;
  let delimiters: Delimiters;

  beforeEach(() => {
    parser = new EdifactSegmentParser();
    delimiters = Delimiters.custom({
      component: ':',
      element: '+',
      decimal: '.',
      escape: '?',
      segment: "'"
    });
  });

  describe('parseSegment', () => {
    it('should extract segment tag', () => {
      const segmentString = "UNH+1+ORDERS:D:96A:UN'";

      const result = parser.parseSegment(segmentString, delimiters);

      expect(result.tag).toBe('UNH');
      expect(result).toBeInstanceOf(EDISegment);
    });

    it('should parse simple elements', () => {
      const segmentString = "UNB+UNOC+SENDER+RECEIVER'";

      const result = parser.parseSegment(segmentString, delimiters);

      expect(result.tag).toBe('UNB');
      expect(result.elements).toHaveLength(3);
      expect(result.elements[0]?.value).toBe('UNOC');
      expect(result.elements[1]?.value).toBe('SENDER');
      expect(result.elements[2]?.value).toBe('RECEIVER');
    });

    it('should parse composite elements', () => {
      const segmentString = "UNH+1+ORDERS:D:96A:UN'";

      const result = parser.parseSegment(segmentString, delimiters);

      expect(result.tag).toBe('UNH');
      expect(result.elements).toHaveLength(2);

      // First element: "1" (simple)
      expect(result.elements[0]?.value).toBe('1');

      // Second element: "ORDERS:D:96A:UN" (composite)
      const compositeElement = result.elements[1];
      expect(compositeElement?.value).toBe('ORDERS:D:96A:UN');

      // Check if element can identify itself as composite
      const elementValue = compositeElement?.value || '';
      expect(elementValue.includes(':')).toBe(true);
    });

    it('should handle empty elements', () => {
      const segmentString = "NAD+BY+123++NAME'";

      const result = parser.parseSegment(segmentString, delimiters);

      expect(result.tag).toBe('NAD');
      expect(result.elements).toHaveLength(4);
      expect(result.elements[0]?.value).toBe('BY');
      expect(result.elements[1]?.value).toBe('123');
      expect(result.elements[2]?.value).toBe(''); // Empty!
      expect(result.elements[3]?.value).toBe('NAME');
    });

    it('should handle escaped characters', () => {
      const segmentString = "FTX+AAA+++TEST?+VALUE'";

      const result = parser.parseSegment(segmentString, delimiters);

      expect(result.tag).toBe('FTX');
      expect(result.elements).toHaveLength(4); // AAA, empty, empty, TEST+VALUE
      expect(result.elements[0]?.value).toBe('AAA');
      expect(result.elements[1]?.value).toBe(''); // First empty
      expect(result.elements[2]?.value).toBe(''); // Second empty
      expect(result.elements[3]?.value).toBe('TEST+VALUE'); // ?+ = literal +
    });

    it('should handle segment with no elements', () => {
      const segmentString = "UNT'";

      const result = parser.parseSegment(segmentString, delimiters);

      expect(result.tag).toBe('UNT');
      expect(result.elements).toHaveLength(0);
    });

    it('should handle complex composite with multiple components', () => {
      const segmentString = "DTM+137:20210122:102'";

      const result = parser.parseSegment(segmentString, delimiters);

      expect(result.tag).toBe('DTM');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]?.value).toBe('137:20210122:102');
    });

    it('should preserve element order', () => {
      const segmentString = "TEST+FIRST+SECOND+THIRD'";

      const result = parser.parseSegment(segmentString, delimiters);

      expect(result.elements).toHaveLength(3);
      expect(result.elements[0]?.value).toBe('FIRST');
      expect(result.elements[1]?.value).toBe('SECOND');
      expect(result.elements[2]?.value).toBe('THIRD');
    });

    it('should throw error for empty segment string', () => {
      expect(() => {
        parser.parseSegment('', delimiters);
      }).toThrow('Segment string cannot be empty');
    });

    it('should handle segment terminator at end', () => {
      const segmentString = "BGM+220+ORDER123+9'";

      const result = parser.parseSegment(segmentString, delimiters);

      expect(result.tag).toBe('BGM');
      expect(result.elements).toHaveLength(3);
      expect(result.elements[2]?.value).toBe('9');
      expect(result.elements[2]?.value).not.toContain("'");
    });
  });
});
