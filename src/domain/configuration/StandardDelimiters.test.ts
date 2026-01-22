import { describe, it, expect } from 'vitest';
import { StandardDelimiters } from './StandardDelimiters';
import { Standard } from '../value-objects/Standard';

describe('StandardDelimiters', () => {
  describe('getDefault', () => {
    it('should return EDIFACT default delimiters', () => {
      const delimiters = StandardDelimiters.getDefault(Standard.EDIFACT);

      expect(delimiters.component).toBe(':');
      expect(delimiters.element).toBe('+');
      expect(delimiters.decimal).toBe('.');
      expect(delimiters.escape).toBe('?');
      expect(delimiters.segment).toBe("'");
    });

    it('should return X12 default delimiters', () => {
      const delimiters = StandardDelimiters.getDefault(Standard.X12);

      expect(delimiters.component).toBe('>');
      expect(delimiters.element).toBe('*');
      expect(delimiters.segment).toBe('~');
      expect(delimiters.repetition).toBe('^');
    });

    it('should return VDA default delimiters', () => {
      const delimiters = StandardDelimiters.getDefault(Standard.VDA);

      expect(delimiters.element).toBe(';');
      expect(delimiters.segment).toBe('\n');
    });

    it('should throw error for unsupported standard', () => {
      // IDOC not yet configured
      expect(() => StandardDelimiters.getDefault(Standard.IDOC)).toThrow(
        'No default delimiters defined for standard: IDOC'
      );
    });
  });

  describe('hasConfiguration', () => {
    it('should return true for EDIFACT', () => {
      expect(StandardDelimiters.hasConfiguration(Standard.EDIFACT)).toBe(true);
    });

    it('should return true for X12', () => {
      expect(StandardDelimiters.hasConfiguration(Standard.X12)).toBe(true);
    });

    it('should return true for VDA', () => {
      expect(StandardDelimiters.hasConfiguration(Standard.VDA)).toBe(true);
    });

    it('should return false for IDOC', () => {
      expect(StandardDelimiters.hasConfiguration(Standard.IDOC)).toBe(false);
    });
  });

  describe('getSupportedStandards', () => {
    it('should return array of supported standards', () => {
      const standards = StandardDelimiters.getSupportedStandards();

      expect(standards).toContain(Standard.EDIFACT);
      expect(standards).toContain(Standard.X12);
      expect(standards).toContain(Standard.VDA);
      expect(standards.length).toBe(3);
    });
  });
});
