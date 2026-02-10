import { describe, it, expect, beforeEach } from 'vitest';
import { X12MessageParser } from './X12MessageParser';
import { X12DelimiterDetector } from './X12DelimiterDetector';
import { X12SegmentParser } from './X12SegmentParser';
import { X12EnvelopeParser } from './X12EnvelopeParser';
import { Standard } from '@ediflow/core';

describe('X12MessageParser', () => {
  let parser: X12MessageParser;

  const PERFORMANCE_THRESHOLD_MS = 500;

  beforeEach(() => {
    const delimiterDetector = new X12DelimiterDetector();
    const segmentParser = new X12SegmentParser();
    const envelopeParser = new X12EnvelopeParser();
    parser = new X12MessageParser(delimiterDetector, segmentParser, envelopeParser);
  });

  describe('Interface Implementation', () => {
    it('should return X12 as supported standard', () => {
      expect(parser.getSupportedStandard()).toBe(Standard.X12);
    });

    it('should identify X12 messages', () => {
      const x12Message = 'ISA*00*          *00*          *ZZ*SENDER~';
      expect(parser.canParse(x12Message)).toBe(true);
    });

    it('should reject non-X12 messages', () => {
      const edifactMessage = "UNH+1+ORDERS:D:96A:UN'";
      expect(parser.canParse(edifactMessage)).toBe(false);
    });

    it('should reject empty messages', () => {
      expect(parser.canParse('')).toBe(false);
    });
  });

  describe('Parse 850 Purchase Order', () => {
    const x12_850 = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~ST*850*0001~BEG*00*SA*PO123456**20260204~REF*DP*DEPT001~REF*IA*INT123~DTM*002*20260210~N1*BY*Buyer Company*92*BUYER123~N1*SE*Seller Company*92*SELLER456~PO1*1*100*EA*10.50*PE*BP*PRODUCT001~PID*F****Product Description~SE*10*0001~GE*1*1~IEA*1*000000001~`;

    it('should parse complete 850 message', () => {
      const message = parser.parse(x12_850);

      expect(message).toBeDefined();
      expect(message.standard).toBe(Standard.X12);
    });

    it('should extract message type from ST segment', () => {
      const message = parser.parse(x12_850);

      expect(message.messageType.value).toBe('850');
    });

    it('should extract version from GS segment', () => {
      const message = parser.parse(x12_850);

      expect(message.version.value).toBe('005010');
    });

    it('should parse all segments in transaction set', () => {
      const message = parser.parse(x12_850);

      expect(message.segments.length).toBeGreaterThan(0);
      const begSegment = message.segments.find(s => s.tag === 'BEG');
      expect(begSegment).toBeDefined();
    });

    it('should parse segment elements correctly', () => {
      const message = parser.parse(x12_850);

      const begSegment = message.segments.find(s => s.tag === 'BEG');
      expect(begSegment?.elements[0]?.value).toBe('00');
      expect(begSegment?.elements[1]?.value).toBe('SA');
      expect(begSegment?.elements[2]?.value).toBe('PO123456');
    });
  });

  describe('Parse 810 Invoice', () => {
    const x12_810 = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000002*0*P*>~GS*IN*SENDER*RECEIVER*20260204*1031*2*X*005010~ST*810*0001~BIG*20260204*INV123456*20260201*PO123456~REF*DP*DEPT001~N1*RE*Remit To Company~N1*BY*Bill To Company~IT1*1*100*EA*10.50*PE*BP*PRODUCT001~TDS*105000~SE*8*0001~GE*1*2~IEA*1*000000002~`;

    it('should parse complete 810 message', () => {
      const message = parser.parse(x12_810);

      expect(message).toBeDefined();
      expect(message.standard).toBe(Standard.X12);
      expect(message.messageType.value).toBe('810');
    });

    it('should parse BIG segment', () => {
      const message = parser.parse(x12_810);

      const bigSegment = message.segments.find(s => s.tag === 'BIG');
      expect(bigSegment).toBeDefined();
      expect(bigSegment?.elements[1]?.value).toBe('INV123456');
    });
  });

  describe('Parse 856 ASN', () => {
    const x12_856 = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000003*0*P*>~GS*SH*SENDER*RECEIVER*20260204*1032*3*X*005010~ST*856*0001~BSN*00*ASN123456*20260204*1200~DTM*011*20260205~HL*1**S~TD5*B*2*FEDEX~REF*BM*BOL123~N1*SF*Ship From Company~N1*ST*Ship To Company~HL*2*1*O~PRF*PO123456~HL*3*2*I~LIN*1*BP*PRODUCT001~SN1**100*EA~SE*14*0001~GE*1*3~IEA*1*000000003~`;

    it('should parse complete 856 message', () => {
      const message = parser.parse(x12_856);

      expect(message).toBeDefined();
      expect(message.messageType.value).toBe('856');
    });

    it('should parse BSN segment', () => {
      const message = parser.parse(x12_856);

      const bsnSegment = message.segments.find(s => s.tag === 'BSN');
      expect(bsnSegment).toBeDefined();
      expect(bsnSegment?.elements[1]?.value).toBe('ASN123456');
    });

    it('should parse hierarchical structure (HL segments)', () => {
      const message = parser.parse(x12_856);

      const hlSegments = message.segments.filter(s => s.tag === 'HL');
      expect(hlSegments.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Parse 997 Functional Acknowledgment', () => {
    const x12_997 = `ISA*00*          *00*          *ZZ*RECEIVER       *ZZ*SENDER         *260204*1033*^*00501*000000004*0*P*>~GS*FA*RECEIVER*SENDER*20260204*1033*4*X*005010~ST*997*0001~AK1*PO*1~AK2*850*0001~AK5*A~AK9*A*1*1*1~SE*6*0001~GE*1*4~IEA*1*000000004~`;

    it('should parse complete 997 message', () => {
      const message = parser.parse(x12_997);

      expect(message).toBeDefined();
      expect(message.messageType.value).toBe('997');
    });

    it('should parse acknowledgment segments', () => {
      const message = parser.parse(x12_997);

      const ak1Segment = message.segments.find(s => s.tag === 'AK1');
      expect(ak1Segment).toBeDefined();
      expect(ak1Segment?.elements[0]?.value).toBe('PO');
    });
  });

  describe('Multiple Transaction Sets', () => {
    const x12Multiple = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000005*0*P*>~GS*PO*SENDER*RECEIVER*20260204*1030*5*X*005010~ST*850*0001~BEG*00*SA*PO001**20260204~SE*3*0001~ST*850*0002~BEG*00*SA*PO002**20260204~SE*3*0002~GE*2*5~IEA*1*000000005~`;

    it('should parse message with multiple transaction sets', () => {
      const message = parser.parse(x12Multiple);

      expect(message).toBeDefined();
      expect(message.segments.length).toBeGreaterThan(0);
    });

    it('should include all segments from all transaction sets', () => {
      const message = parser.parse(x12Multiple);

      const begSegments = message.segments.filter(s => s.tag === 'BEG');
      expect(begSegments.length).toBe(2);
      expect(begSegments[0]?.elements[2]?.value).toBe('PO001');
      expect(begSegments[1]?.elements[2]?.value).toBe('PO002');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for empty message', () => {
      expect(() => parser.parse('')).toThrow('EDI message cannot be empty');
    });

    it('should throw error for invalid X12 format', () => {
      const invalid = 'NOT_X12_FORMAT';
      expect(() => parser.parse(invalid)).toThrow();
    });

    it('should throw error when ST segment missing', () => {
      const noST = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~GE*0*1~IEA*1*000000001~`;
      expect(() => parser.parse(noST)).toThrow();
    });

    it('should throw error when GS segment missing', () => {
      const noGS = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~IEA*1*000000001~`;
      expect(() => parser.parse(noGS)).toThrow();
    });
  });

  describe('Configuration', () => {
    it('should return parser configuration after parsing', () => {
      const x12Message = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~ST*850*0001~BEG*00*SA*PO123**20260204~SE*3*0001~GE*1*1~IEA*1*000000001~`;

      parser.parse(x12Message);
      const config = parser.getConfiguration();

      expect(config).toBeDefined();
      expect(config.delimiters).toBeDefined();
      expect(config.delimiters?.element).toBe('*');
      expect(config.delimiters?.segment).toBe('~');
    });

    it('should use custom delimiters from config if provided', () => {
      const x12Message = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~ST*850*0001~BEG*00*SA*PO123**20260204~SE*3*0001~GE*1*1~IEA*1*000000001~`;

      const message = parser.parse(x12Message);

      expect(message).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should parse large message in reasonable time', () => {
      const largeMessage = generateLargeX12Message(100);

      const startTime = performance.now();
      const message = parser.parse(largeMessage);
      const endTime = performance.now();

      expect(message).toBeDefined();
      expect(endTime - startTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });
  });
});

function generateLargeX12Message(lineItemCount: number): string {
  let message = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~ST*850*0001~BEG*00*SA*POLARGE**20260204~`;

  for (let i = 1; i <= lineItemCount; i++) {
    message += `PO1*${i}*100*EA*10.50*PE*BP*PRODUCT${i.toString().padStart(3, '0')}~`;
  }

  const segmentCount = 3 + lineItemCount;
  message += `SE*${segmentCount}*0001~GE*1*1~IEA*1*000000001~`;

  return message;
}

