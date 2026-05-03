import { describe, it, expect } from 'vitest';
import { X12Tokenizer } from './X12Tokenizer';
import { Delimiters } from '@ediflow/core';

describe('X12Tokenizer', () => {
  const tokenizer = new X12Tokenizer();

  const standardDelimiters = Delimiters.custom({
    component: '>',
    element: '*',
    decimal: '.',
    escape: '',
    segment: '~',
    repetition: '^',
  });

  describe('tokenize', () => {
    it('should split X12 message into segments by segment terminator', () => {
      const message = 'ISA*00*~GS*PO*~ST*850*0001~SE*3*0001~GE*1*1~IEA*1*1~';

      const result = tokenizer.tokenize(message, standardDelimiters);

      expect(result).toHaveLength(6);
      expect(result[0]).toBe('ISA*00*');
      expect(result[1]).toBe('GS*PO*');
    });

    it('should return empty array for empty message', () => {
      expect(tokenizer.tokenize('', standardDelimiters)).toEqual([]);
    });

    it('should return empty array for whitespace-only message', () => {
      expect(tokenizer.tokenize('   ', standardDelimiters)).toEqual([]);
    });

    it('should trim whitespace from segments', () => {
      const message = 'ISA*00*  ~  GS*PO*~';

      const result = tokenizer.tokenize(message, standardDelimiters);

      expect(result[0]).toBe('ISA*00*');
      expect(result[1]).toBe('GS*PO*');
    });

    it('should filter out empty segments', () => {
      const message = 'ISA*00*~~GS*PO*~';

      const result = tokenizer.tokenize(message, standardDelimiters);

      expect(result).toHaveLength(2);
    });

    it('should handle single segment message', () => {
      const message = 'ISA*00*~';

      const result = tokenizer.tokenize(message, standardDelimiters);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('ISA*00*');
    });

    it('should handle real-world 850 message segments', () => {
      const message = [
        'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>',
        'GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010',
        'ST*850*0001',
        'BEG*00*SA*PO123**20260204',
        'SE*3*0001',
        'GE*1*1',
        'IEA*1*000000001',
        '',
      ].join('~');

      const result = tokenizer.tokenize(message, standardDelimiters);

      expect(result).toHaveLength(7);
      expect(result[0]).toContain('ISA');
      expect(result[2]).toBe('ST*850*0001');
    });
  });
});

