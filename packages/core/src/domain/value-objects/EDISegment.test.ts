import { describe, it, expect } from 'vitest';
import { EDISegment } from './EDISegment';
import { EDIElement } from './EDIElement';

describe('EDISegment', () => {
  const elements = [
    new EDIElement('220'),
    new EDIElement('PO-001'),
    new EDIElement('9'),
  ];
  const segment = new EDISegment('BGM', elements);

  it('stores tag and elements', () => {
    expect(segment.tag).toBe('BGM');
    expect(segment.elements).toHaveLength(3);
  });

  describe('getElement', () => {
    it('returns element at valid position', () => {
      expect(segment.getElement(0)?.value).toBe('220');
      expect(segment.getElement(2)?.value).toBe('9');
    });

    it('returns undefined for out-of-range position', () => {
      expect(segment.getElement(99)).toBeUndefined();
    });
  });

  describe('getElementCount', () => {
    it('returns the number of elements', () => {
      expect(segment.getElementCount()).toBe(3);
    });

    it('returns 0 for empty segment', () => {
      expect(new EDISegment('UNZ', []).getElementCount()).toBe(0);
    });
  });
});

