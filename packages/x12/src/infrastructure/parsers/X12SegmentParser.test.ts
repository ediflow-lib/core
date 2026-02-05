import { describe, it, expect } from 'vitest';
import { X12SegmentParser } from './X12SegmentParser';
import { Delimiters } from '@ediflow/core';

describe('X12SegmentParser', () => {
  const parser = new X12SegmentParser();

  const standardDelimiters = Delimiters.custom({
    component: '>',
    element: '*',
    decimal: '.',
    escape: '',
    segment: '~',
    repetition: '^',
  });

  describe('Tag Parsing', () => {
    it('should extract segment tag', () => {
      const segment = parser.parseSegment('REF*DP*12345~', standardDelimiters);

      expect(segment.tag).toBe('REF');
    });

    it('should handle segment without elements', () => {
      const segment = parser.parseSegment('SE~', standardDelimiters);

      expect(segment.tag).toBe('SE');
      expect(segment.elements).toHaveLength(0);
    });
  });

  describe('Element Parsing', () => {
    it('should parse simple elements', () => {
      const segment = parser.parseSegment('REF*DP*12345~', standardDelimiters);

      expect(segment.elements).toHaveLength(2);
      expect(segment.elements[0].value).toBe('DP');
      expect(segment.elements[1].value).toBe('12345');
    });

    it('should handle empty elements', () => {
      const segment = parser.parseSegment('REF*DP**VALUE~', standardDelimiters);

      expect(segment.elements).toHaveLength(3);
      expect(segment.elements[0].value).toBe('DP');
      expect(segment.elements[1].value).toBe('');
      expect(segment.elements[2].value).toBe('VALUE');
    });

    it('should handle trailing empty elements', () => {
      const segment = parser.parseSegment('REF*DP*12345*~', standardDelimiters);

      expect(segment.elements).toHaveLength(3);
      expect(segment.elements[2].value).toBe('');
    });
  });

  describe('Component/Sub-Element Parsing', () => {
    it('should parse composite elements with components', () => {
      const segment = parser.parseSegment('DTM*007>20260204>102~', standardDelimiters);

      expect(segment.elements).toHaveLength(1);
      expect(segment.elements[0].value).toBe('007>20260204>102');
      expect(segment.elements[0].components).toEqual(['007', '20260204', '102']);
      expect(segment.elements[0].isComposite()).toBe(true);
    });

    it('should handle empty components', () => {
      const segment = parser.parseSegment('DTM*007>>102~', standardDelimiters);

      expect(segment.elements[0].components).toEqual(['007', '', '102']);
    });

    it('should handle single component as simple element', () => {
      const segment = parser.parseSegment('REF*DP~', standardDelimiters);

      expect(segment.elements[0].value).toBe('DP');
      expect(segment.elements[0].components).toEqual([]);
      expect(segment.elements[0].isComposite()).toBe(false);
    });
  });

  describe('Repetition Separator', () => {
    it('should parse repetitions within element', () => {
      const customDelimiters = Delimiters.custom({
        component: '>',
        element: '*',
        decimal: '.',
        escape: '',
        segment: '~',
        repetition: '^',
      });

      const segment = parser.parseSegment('REF*DP*12345^67890~', customDelimiters);

      expect(segment.elements[1].value).toBe('12345^67890');
      expect(segment.elements[1].components).toEqual(['12345', '67890']);
    });

    it('should handle repetition with components', () => {
      const customDelimiters = Delimiters.custom({
        component: '>',
        element: '*',
        decimal: '.',
        escape: '',
        segment: '~',
        repetition: '^',
      });

      const segment = parser.parseSegment('DTM*007>20260204^008>20260205~', customDelimiters);

      expect(segment.elements[0].components).toEqual(['007>20260204', '008>20260205']);
    });
  });

  describe('Edge Cases', () => {
    it('should throw error for empty segment string', () => {
      expect(() => parser.parseSegment('', standardDelimiters))
        .toThrow('Segment string cannot be empty');
    });

    it('should remove segment terminator from input', () => {
      const segment = parser.parseSegment('REF*DP*12345~', standardDelimiters);

      expect(segment.tag).toBe('REF');
      expect(segment.elements[1].value).toBe('12345');
    });

    it('should handle segment without terminator', () => {
      const segment = parser.parseSegment('REF*DP*12345', standardDelimiters);

      expect(segment.tag).toBe('REF');
      expect(segment.elements[1].value).toBe('12345');
    });

    it('should handle ISA segment (special case)', () => {
      const segment = parser.parseSegment('ISA*00*          *00*          *ZZ*SENDER~', standardDelimiters);

      expect(segment.tag).toBe('ISA');
      expect(segment.elements).toHaveLength(6);
    });
  });

  describe('Integration with Core Entities', () => {
    it('should return EDISegment from @ediflow/core', () => {
      const segment = parser.parseSegment('REF*DP*12345~', standardDelimiters);

      expect(segment.constructor.name).toBe('EDISegment');
    });

    it('should return EDIElement from @ediflow/core', () => {
      const segment = parser.parseSegment('REF*DP*12345~', standardDelimiters);

      expect(segment.elements[0].constructor.name).toBe('EDIElement');
    });
  });
});
