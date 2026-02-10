import { describe, it, expect } from 'vitest';
import { X12DelimiterDetector } from './X12DelimiterDetector';

describe('X12DelimiterDetector', () => {
  const detector = new X12DelimiterDetector();

  describe('detect', () => {
    it('should extract standard delimiters from ISA segment', () => {
      const message = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1200*U*00401*000000001*0*P*>~';

      const delimiters = detector.detect(message);

      expect(delimiters.element).toBe('*');
      expect(delimiters.component).toBe('>');
      expect(delimiters.segment).toBe('~');
      expect(delimiters.repetition).toBe('U');
    });

    it('should handle ISA without repetition separator (space at position 82)', () => {
      const message = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1200* *00401*000000001*0*P*>~';

      const delimiters = detector.detect(message);

      expect(delimiters.element).toBe('*');
      expect(delimiters.repetition).toBeUndefined();
    });

    it('should handle custom delimiters', () => {
      const message = 'ISA|00|          |00|          |ZZ|SENDER         |ZZ|RECEIVER       |260204|1200|^|00401|000000001|0|P|:@';

      const delimiters = detector.detect(message);

      expect(delimiters.element).toBe('|');
      expect(delimiters.component).toBe(':');
      expect(delimiters.segment).toBe('@');
      expect(delimiters.repetition).toBe('^');
    });

    it('should throw error if message does not start with ISA', () => {
      const message = 'GS*PO*SENDER*RECEIVER~';

      expect(() => detector.detect(message))
        .toThrow('X12 message must start with ISA segment');
    });

    it('should throw error if ISA is too short', () => {
      const message = 'ISA*00*~';

      expect(() => detector.detect(message))
        .toThrow('ISA segment must be at least 106 characters');
    });

    it('should throw error for empty message', () => {
      expect(() => detector.detect(''))
        .toThrow('Message cannot be empty');
    });
  });

  describe('getMessageWithoutFormatSpecificHeader', () => {
    it('should return full message (ISA is not a separate header)', () => {
      const message = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1200*U*00401*000000001*0*P*>~GS*PO~';

      const result = detector.getMessageWithoutFormatSpecificHeader(message);

      expect(result).toBe(message);
    });
  });
});
