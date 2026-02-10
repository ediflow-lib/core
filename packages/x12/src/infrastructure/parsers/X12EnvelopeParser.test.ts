import { describe, it, expect } from 'vitest';
import { X12EnvelopeParser } from './X12EnvelopeParser';
import { X12SegmentParser } from './X12SegmentParser';
import { Delimiters } from '@ediflow/core';

describe('X12EnvelopeParser', () => {
  const segmentParser = new X12SegmentParser();
  const envelopeParser = new X12EnvelopeParser();

  const standardDelimiters = Delimiters.custom({
    component: '>',
    element: '*',
    decimal: '.',
    escape: '',
    segment: '~',
    repetition: '^',
  });

  const ISA_CONTROL_NUMBER_POSITION = 12;

  describe('ISA Segment Parsing', () => {
    it('should parse ISA segment', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('IEA*0*000000001~', standardDelimiters),
      ];

      const interchange = envelopeParser.parse(segments);

      expect(interchange.isa).toBeDefined();
      expect(interchange.isa.tag).toBe('ISA');
    });

    it('should extract ISA control number', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('IEA*0*000000001~', standardDelimiters),
      ];

      const interchange = envelopeParser.parse(segments);

      expect(interchange.isa.elements[ISA_CONTROL_NUMBER_POSITION]?.value).toBe('000000001');
    });
  });

  describe('GS Segment Parsing', () => {
    it('should parse GS segment', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('GE*0*1~', standardDelimiters),
        segmentParser.parseSegment('IEA*1*000000001~', standardDelimiters),
      ];

      const interchange = envelopeParser.parse(segments);

      expect(interchange.functionalGroups).toHaveLength(1);
      expect(interchange.functionalGroups[0]?.gs.tag).toBe('GS');
    });

    it('should extract GS control number', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('GE*0*1~', standardDelimiters),
        segmentParser.parseSegment('IEA*1*000000001~', standardDelimiters),
      ];

      const interchange = envelopeParser.parse(segments);

      expect(interchange.functionalGroups[0]?.gs.elements[5]?.value).toBe('1');
    });
  });

  describe('ST/SE Segment Parsing', () => {
    it('should parse ST segment', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('ST*850*0001~', standardDelimiters),
        segmentParser.parseSegment('BEG*00*SA*PO123**20260204~', standardDelimiters),
        segmentParser.parseSegment('SE*3*0001~', standardDelimiters),
        segmentParser.parseSegment('GE*1*1~', standardDelimiters),
        segmentParser.parseSegment('IEA*1*000000001~', standardDelimiters),
      ];

      const interchange = envelopeParser.parse(segments);

      expect(interchange.functionalGroups[0]?.transactionSets).toHaveLength(1);
      expect(interchange.functionalGroups[0]?.transactionSets[0]?.st.tag).toBe('ST');
    });

    it('should parse SE segment', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('ST*850*0001~', standardDelimiters),
        segmentParser.parseSegment('BEG*00*SA*PO123**20260204~', standardDelimiters),
        segmentParser.parseSegment('SE*3*0001~', standardDelimiters),
        segmentParser.parseSegment('GE*1*1~', standardDelimiters),
        segmentParser.parseSegment('IEA*1*000000001~', standardDelimiters),
      ];

      const interchange = envelopeParser.parse(segments);

      expect(interchange.functionalGroups[0]?.transactionSets[0]?.se.tag).toBe('SE');
    });

    it('should include segments between ST and SE', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('ST*850*0001~', standardDelimiters),
        segmentParser.parseSegment('BEG*00*SA*PO123**20260204~', standardDelimiters),
        segmentParser.parseSegment('REF*DP*DEPT001~', standardDelimiters),
        segmentParser.parseSegment('SE*4*0001~', standardDelimiters),
        segmentParser.parseSegment('GE*1*1~', standardDelimiters),
        segmentParser.parseSegment('IEA*1*000000001~', standardDelimiters),
      ];

      const interchange = envelopeParser.parse(segments);

      expect(interchange.functionalGroups[0]?.transactionSets[0]?.segments).toHaveLength(2);
      expect(interchange.functionalGroups[0]?.transactionSets[0]?.segments[0]?.tag).toBe('BEG');
      expect(interchange.functionalGroups[0]?.transactionSets[0]?.segments[1]?.tag).toBe('REF');
    });
  });

  describe('GE Segment Parsing', () => {
    it('should parse GE segment', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('GE*0*1~', standardDelimiters),
        segmentParser.parseSegment('IEA*1*000000001~', standardDelimiters),
      ];

      const interchange = envelopeParser.parse(segments);

      expect(interchange.functionalGroups[0]?.ge.tag).toBe('GE');
    });
  });

  describe('IEA Segment Parsing', () => {
    it('should parse IEA segment', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('IEA*0*000000001~', standardDelimiters),
      ];

      const interchange = envelopeParser.parse(segments);

      expect(interchange.iea).toBeDefined();
      expect(interchange.iea.tag).toBe('IEA');
    });
  });

  describe('Validation - Segment Counts', () => {
    it('should validate SE segment count', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('ST*850*0001~', standardDelimiters),
        segmentParser.parseSegment('BEG*00*SA*PO123**20260204~', standardDelimiters),
        segmentParser.parseSegment('SE*3*0001~', standardDelimiters),
        segmentParser.parseSegment('GE*1*1~', standardDelimiters),
        segmentParser.parseSegment('IEA*1*000000001~', standardDelimiters),
      ];

      expect(() => envelopeParser.parse(segments)).not.toThrow();
    });

    it('should throw error when SE count is incorrect', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('ST*850*0001~', standardDelimiters),
        segmentParser.parseSegment('BEG*00*SA*PO123**20260204~', standardDelimiters),
        segmentParser.parseSegment('SE*5*0001~', standardDelimiters),
        segmentParser.parseSegment('GE*1*1~', standardDelimiters),
        segmentParser.parseSegment('IEA*1*000000001~', standardDelimiters),
      ];

      expect(() => envelopeParser.parse(segments))
        .toThrow('SE segment count mismatch');
    });

    it('should validate GE transaction set count', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('ST*850*0001~', standardDelimiters),
        segmentParser.parseSegment('BEG*00*SA*PO123**20260204~', standardDelimiters),
        segmentParser.parseSegment('SE*3*0001~', standardDelimiters),
        segmentParser.parseSegment('GE*1*1~', standardDelimiters),
        segmentParser.parseSegment('IEA*1*000000001~', standardDelimiters),
      ];

      expect(() => envelopeParser.parse(segments)).not.toThrow();
    });

    it('should throw error when GE count is incorrect', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('ST*850*0001~', standardDelimiters),
        segmentParser.parseSegment('BEG*00*SA*PO123**20260204~', standardDelimiters),
        segmentParser.parseSegment('SE*3*0001~', standardDelimiters),
        segmentParser.parseSegment('GE*5*1~', standardDelimiters),
        segmentParser.parseSegment('IEA*1*000000001~', standardDelimiters),
      ];

      expect(() => envelopeParser.parse(segments))
        .toThrow('GE transaction set count mismatch');
    });

    it('should validate IEA functional group count', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('GE*0*1~', standardDelimiters),
        segmentParser.parseSegment('IEA*1*000000001~', standardDelimiters),
      ];

      expect(() => envelopeParser.parse(segments)).not.toThrow();
    });

    it('should throw error when IEA count is incorrect', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('GE*0*1~', standardDelimiters),
        segmentParser.parseSegment('IEA*5*000000001~', standardDelimiters),
      ];

      expect(() => envelopeParser.parse(segments))
        .toThrow('IEA functional group count mismatch');
    });
  });

  describe('Validation - Control Numbers', () => {
    it('should validate ST and SE control numbers match', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('ST*850*0001~', standardDelimiters),
        segmentParser.parseSegment('BEG*00*SA*PO123**20260204~', standardDelimiters),
        segmentParser.parseSegment('SE*3*0001~', standardDelimiters),
        segmentParser.parseSegment('GE*1*1~', standardDelimiters),
        segmentParser.parseSegment('IEA*1*000000001~', standardDelimiters),
      ];

      expect(() => envelopeParser.parse(segments)).not.toThrow();
    });

    it('should throw error when ST and SE control numbers do not match', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('ST*850*0001~', standardDelimiters),
        segmentParser.parseSegment('BEG*00*SA*PO123**20260204~', standardDelimiters),
        segmentParser.parseSegment('SE*3*9999~', standardDelimiters),
        segmentParser.parseSegment('GE*1*1~', standardDelimiters),
        segmentParser.parseSegment('IEA*1*000000001~', standardDelimiters),
      ];

      expect(() => envelopeParser.parse(segments))
        .toThrow('ST/SE control number mismatch');
    });

    it('should validate GS and GE control numbers match', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('GE*0*1~', standardDelimiters),
        segmentParser.parseSegment('IEA*1*000000001~', standardDelimiters),
      ];

      expect(() => envelopeParser.parse(segments)).not.toThrow();
    });

    it('should throw error when GS and GE control numbers do not match', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('GE*0*9999~', standardDelimiters),
        segmentParser.parseSegment('IEA*1*000000001~', standardDelimiters),
      ];

      expect(() => envelopeParser.parse(segments))
        .toThrow('GS/GE control number mismatch');
    });

    it('should validate ISA and IEA control numbers match', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('IEA*0*000000001~', standardDelimiters),
      ];

      expect(() => envelopeParser.parse(segments)).not.toThrow();
    });

    it('should throw error when ISA and IEA control numbers do not match', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('IEA*0*999999999~', standardDelimiters),
      ];

      expect(() => envelopeParser.parse(segments))
        .toThrow('ISA/IEA control number mismatch');
    });
  });

  describe('Multiple Functional Groups', () => {
    it('should parse multiple functional groups', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('GE*0*1~', standardDelimiters),
        segmentParser.parseSegment('GS*IN*SENDER*RECEIVER*20260204*1031*2*X*005010~', standardDelimiters),
        segmentParser.parseSegment('GE*0*2~', standardDelimiters),
        segmentParser.parseSegment('IEA*2*000000001~', standardDelimiters),
      ];

      const interchange = envelopeParser.parse(segments);

      expect(interchange.functionalGroups).toHaveLength(2);
      expect(interchange.functionalGroups[0]?.gs.elements[0]?.value).toBe('PO');
      expect(interchange.functionalGroups[1]?.gs.elements[0]?.value).toBe('IN');
    });
  });

  describe('Multiple Transaction Sets', () => {
    it('should parse multiple transaction sets in one functional group', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('ST*850*0001~', standardDelimiters),
        segmentParser.parseSegment('BEG*00*SA*PO123**20260204~', standardDelimiters),
        segmentParser.parseSegment('SE*3*0001~', standardDelimiters),
        segmentParser.parseSegment('ST*850*0002~', standardDelimiters),
        segmentParser.parseSegment('BEG*00*SA*PO456**20260204~', standardDelimiters),
        segmentParser.parseSegment('SE*3*0002~', standardDelimiters),
        segmentParser.parseSegment('GE*2*1~', standardDelimiters),
        segmentParser.parseSegment('IEA*1*000000001~', standardDelimiters),
      ];

      const interchange = envelopeParser.parse(segments);

      expect(interchange.functionalGroups[0]?.transactionSets).toHaveLength(2);
      expect(interchange.functionalGroups[0]?.transactionSets[0]?.st.elements[1]?.value).toBe('0001');
      expect(interchange.functionalGroups[0]?.transactionSets[1]?.st.elements[1]?.value).toBe('0002');
    });
  });

  describe('Error Cases', () => {
    it('should throw error when ISA segment is missing', () => {
      const segments = [
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('GE*0*1~', standardDelimiters),
        segmentParser.parseSegment('IEA*1*000000001~', standardDelimiters),
      ];

      expect(() => envelopeParser.parse(segments))
        .toThrow('ISA segment not found');
    });

    it('should throw error when IEA segment is missing', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('GE*0*1~', standardDelimiters),
      ];

      expect(() => envelopeParser.parse(segments))
        .toThrow('IEA segment not found');
    });

    it('should throw error when GE is missing for GS', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('IEA*1*000000001~', standardDelimiters),
      ];

      expect(() => envelopeParser.parse(segments))
        .toThrow('GE segment not found');
    });

    it('should throw error when SE is missing for ST', () => {
      const segments = [
        segmentParser.parseSegment('ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~', standardDelimiters),
        segmentParser.parseSegment('GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~', standardDelimiters),
        segmentParser.parseSegment('ST*850*0001~', standardDelimiters),
        segmentParser.parseSegment('BEG*00*SA*PO123**20260204~', standardDelimiters),
        segmentParser.parseSegment('GE*1*1~', standardDelimiters),
        segmentParser.parseSegment('IEA*1*000000001~', standardDelimiters),
      ];

      expect(() => envelopeParser.parse(segments))
        .toThrow('SE segment not found');
    });
  });
});





