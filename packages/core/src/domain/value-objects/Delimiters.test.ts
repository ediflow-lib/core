import { describe, it, expect } from 'vitest';
import { Delimiters } from './Delimiters';

describe('Delimiters', () => {
  describe('custom', () => {
    it('should create custom delimiters', () => {
      const delimiters = Delimiters.custom({
        component: ';',
        element: '|',
        decimal: '.',
        escape: '!',
        segment: '~',
      });

      expect(delimiters.component).toBe(';');
      expect(delimiters.element).toBe('|');
      expect(delimiters.decimal).toBe('.');
      expect(delimiters.escape).toBe('!');
      expect(delimiters.segment).toBe('~');
    });

    it('should validate delimiter uniqueness', () => {
      expect(() =>
        Delimiters.custom({
          component: ':',
          element: ':',
          decimal: '.',
          escape: '?',
          segment: "'",
        })
      ).toThrow('All delimiters must be unique');
    });

    it('should validate single character delimiters', () => {
      expect(() =>
        Delimiters.custom({
          component: '::',
          element: '+',
          decimal: '.',
          escape: '?',
          segment: "'",
        })
      ).toThrow('Delimiter must be a single character');
    });

    it('should validate element and segment delimiters are defined', () => {
      expect(() =>
        Delimiters.custom({
          component: ':',
          element: '',
          decimal: '.',
          escape: '?',
          segment: "'",
        })
      ).toThrow('Element and segment delimiters must be defined');
    });
  });

  describe('toUNA', () => {
    it('should generate UNA string for custom delimiters', () => {
      const delimiters = Delimiters.custom({
        component: ';',
        element: '|',
        decimal: '.',
        escape: '!',
        segment: '~',
      });

      expect(delimiters.toUNA()).toBe('UNA;|.! ~');
    });

    it('should generate UNA string for EDIFACT-style delimiters', () => {
      const delimiters = Delimiters.custom({
        component: ':',
        element: '+',
        decimal: '.',
        escape: '?',
        segment: "'",
      });

      expect(delimiters.toUNA()).toBe("UNA:+.? '");
    });
  });

  describe('equals', () => {
    it('should return true for identical delimiters', () => {
      const delimiters1 = Delimiters.custom({
        component: ':',
        element: '+',
        decimal: '.',
        escape: '?',
        segment: "'",
      });
      const delimiters2 = Delimiters.custom({
        component: ':',
        element: '+',
        decimal: '.',
        escape: '?',
        segment: "'",
      });

      expect(delimiters1.equals(delimiters2)).toBe(true);
    });

    it('should return false for different delimiters', () => {
      const delimiters1 = Delimiters.custom({
        component: ':',
        element: '+',
        decimal: '.',
        escape: '?',
        segment: "'",
      });
      const delimiters2 = Delimiters.custom({
        component: ';',
        element: '|',
        decimal: '.',
        escape: '!',
        segment: '~',
      });

      expect(delimiters1.equals(delimiters2)).toBe(false);
    });
  });

  describe('hasEscape', () => {
    it('should return true when escape character exists', () => {
      const delimiters = Delimiters.custom({
        component: ':',
        element: '+',
        decimal: '.',
        escape: '?',
        segment: "'",
      });

      expect(delimiters.hasEscape()).toBe(true);
    });

    it('should return false when escape character is empty', () => {
      const delimiters = Delimiters.custom({
        component: ';',
        element: '|',
        decimal: '.',
        escape: '',
        segment: '~',
      });

      expect(delimiters.hasEscape()).toBe(false);
    });
  });
});
