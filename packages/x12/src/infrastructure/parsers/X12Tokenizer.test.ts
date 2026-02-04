import { describe, it, expect } from 'vitest';
import { X12Tokenizer } from './X12Tokenizer';

describe('X12Tokenizer', () => {
  const tokenizer = new X12Tokenizer();

  describe('Delimiter Extraction from ISA', () => {
    it('should extract standard delimiters from ISA segment', () => {
      const message = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1200*U*00401*000000001*0*P*>~';

      const tokens = tokenizer.tokenize(message);

      // First token should be ISA with correct delimiter detection
      expect(tokens[0]?.tag).toBe('ISA');
      expect(tokens[0]?.type).toBe('ISA');
    });

    it('should handle custom delimiters in ISA', () => {
      const message = 'ISA|00|          |00|          |ZZ|SENDER         |ZZ|RECEIVER       |260204|1200|U|00401|000000001|0|P|:^';

      const tokens = tokenizer.tokenize(message);

      expect(tokens[0]?.tag).toBe('ISA');
      // Custom: element=|, component=:, segment=^
    });

    it('should throw error if message does not start with ISA', () => {
      const message = 'GS*PO*SENDER*RECEIVER~';

      expect(() => tokenizer.tokenize(message)).toThrow('X12 message must start with ISA');
    });

    it('should throw error if ISA segment is too short', () => {
      const message = 'ISA*00*~';

      expect(() => tokenizer.tokenize(message)).toThrow('ISA segment must be at least 106 characters');
    });
  });

  describe('Segment Splitting', () => {
    it('should split message into segments by segment terminator', () => {
      const message = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1200*U*00401*000000001*0*P*>~GS*PO*SENDER*RECEIVER*20260204*1200*1*X*004010~ST*850*0001~SE*3*0001~GE*1*1~IEA*1*000000001~';

      const tokens = tokenizer.tokenize(message);

      expect(tokens).toHaveLength(6);
      expect(tokens[0]?.tag).toBe('ISA');
      expect(tokens[1]?.tag).toBe('GS');
      expect(tokens[2]?.tag).toBe('ST');
      expect(tokens[3]?.tag).toBe('SE');
      expect(tokens[4]?.tag).toBe('GE');
      expect(tokens[5]?.tag).toBe('IEA');
    });

    it('should handle trailing segment terminator', () => {
      const message = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1200*U*00401*000000001*0*P*>~GS*PO~';

      const tokens = tokenizer.tokenize(message);

      expect(tokens).toHaveLength(2);
      expect(tokens[0]?.tag).toBe('ISA');
      expect(tokens[1]?.tag).toBe('GS');
    });

    it('should filter empty segments', () => {
      const message = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1200*U*00401*000000001*0*P*>~~GS*PO~';

      const tokens = tokenizer.tokenize(message);

      expect(tokens).toHaveLength(2);
      expect(tokens[0]?.tag).toBe('ISA');
      expect(tokens[1]?.tag).toBe('GS');
    });
  });

  describe('Element Parsing', () => {
    it('should parse segment elements', () => {
      const message = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1200*U*00401*000000001*0*P*>~REF*DP*12345~';

      const tokens = tokenizer.tokenize(message);
      const refToken = tokens[1];

      expect(refToken?.tag).toBe('REF');
      expect(refToken?.elements).toEqual([
        ['REF'],
        ['DP'],
        ['12345']
      ]);
    });

    it('should handle empty elements', () => {
      const message = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1200* *00401*000000001*0*P*>~REF*DP**VALUE~';

      const tokens = tokenizer.tokenize(message);
      const refToken = tokens[1];

      expect(refToken?.elements).toEqual([
        ['REF'],
        ['DP'],
        [],
        ['VALUE']
      ]);
    });

    it('should parse composite elements with sub-elements', () => {
      const message = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1200*U*00401*000000001*0*P*>~DTM*007>20260204>102~';

      const tokens = tokenizer.tokenize(message);
      const dtmToken = tokens[1];

      expect(dtmToken?.tag).toBe('DTM');
      expect(dtmToken?.elements).toEqual([
        ['DTM'],
        ['007', '20260204', '102']
      ]);
    });

    it('should handle repetition separator', () => {
      // ISA with repetition separator (^) at position 82
      const message = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1200*^*00401*000000001*0*P*>~REF*DP*12345^67890~';

      const tokens = tokenizer.tokenize(message);
      const refToken = tokens[1];

      expect(refToken?.elements).toEqual([
        ['REF'],
        ['DP'],
        ['12345', '67890']
      ]);
    });
  });

  describe('Segment Type Detection', () => {
    it('should identify ISA segment type', () => {
      const message = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1200*U*00401*000000001*0*P*>~';

      const tokens = tokenizer.tokenize(message);

      expect(tokens[0]?.type).toBe('ISA');
    });

    it('should identify GS segment type', () => {
      const message = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1200*U*00401*000000001*0*P*>~GS*PO*SENDER~';

      const tokens = tokenizer.tokenize(message);

      expect(tokens[1]?.type).toBe('GS');
    });

    it('should identify ST segment type', () => {
      const message = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1200*U*00401*000000001*0*P*>~ST*850*0001~';

      const tokens = tokenizer.tokenize(message);

      expect(tokens[1]?.type).toBe('ST');
    });

    it('should identify generic SEGMENT type for other segments', () => {
      const message = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1200*U*00401*000000001*0*P*>~REF*DP*12345~';

      const tokens = tokenizer.tokenize(message);

      expect(tokens[1]?.type).toBe('SEGMENT');
    });
  });

  describe('Integration Tests', () => {
    it('should tokenize complete X12 850 message', () => {
      const message = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1200*U*00401*000000001*0*P*>~GS*PO*SENDER*RECEIVER*20260204*1200*1*X*004010~ST*850*0001~BEG*00*SA*PO123456**20260204~REF*DP*12345~SE*5*0001~GE*1*1~IEA*1*000000001~`;

      const tokens = tokenizer.tokenize(message);

      expect(tokens).toHaveLength(8);
      expect(tokens[0]?.tag).toBe('ISA');
      expect(tokens[1]?.tag).toBe('GS');
      expect(tokens[2]?.tag).toBe('ST');
      expect(tokens[3]?.tag).toBe('BEG');
      expect(tokens[4]?.tag).toBe('REF');
      expect(tokens[5]?.tag).toBe('SE');
      expect(tokens[6]?.tag).toBe('GE');
      expect(tokens[7]?.tag).toBe('IEA');
    });
  });

  describe('Performance', () => {
    it('should tokenize 1000 segments in less than 100ms', () => {
      // Create message with 1000 segments
      let message = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1200*U*00401*000000001*0*P*>~';
      for (let i = 0; i < 1000; i++) {
        message += `REF*DP*${i}~`;
      }

      const start = performance.now();
      const tokens = tokenizer.tokenize(message);
      const duration = performance.now() - start;

      expect(tokens).toHaveLength(1001); // ISA + 1000 REF
      expect(duration).toBeLessThan(100);
    });
  });
});
