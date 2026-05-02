import { describe, it, expect, beforeEach } from 'vitest';
import { X12MessageParser } from '../../src/infrastructure/parsers/X12MessageParser';
import { X12DelimiterDetector } from '../../src/infrastructure/parsers/X12DelimiterDetector';
import { X12SegmentParser } from '../../src/infrastructure/parsers/X12SegmentParser';
import { X12EnvelopeParser } from '../../src/infrastructure/parsers/X12EnvelopeParser';
import { X12ValidationServiceBuilder } from '../../src/infrastructure/validation/X12ValidationServiceBuilder';
import { Standard } from '@ediflow/core';

const X12_850_004010 = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00401*000000001*0*P*>~GS*PO*SENDER*RECEIVER*20260204*1030*1*X*004010~ST*850*0001~BEG*00*SA*PO123**20260204~PO1*1*100*EA*10.50~SE*4*0001~GE*1*1~IEA*1*000000001~`;
const X12_850_005010 = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~ST*850*0001~BEG*00*SA*PO123**20260204~PO1*1*100*EA*10.50~SE*4*0001~GE*1*1~IEA*1*000000001~`;
const X12_837_005010 = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000002*0*P*>~GS*HC*SENDER*RECEIVER*20260204*1030*2*X*005010~ST*837*0001~BPR*I*100.00~SE*3*0001~GE*1*2~IEA*1*000000002~`;
const X12_856_005010 = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000003*0*P*>~GS*SH*SENDER*RECEIVER*20260204*1030*3*X*005010~ST*856*0001~BSN*00*SHIP001*20260204*1030~HL*1**S~SE*4*0001~GE*1*3~IEA*1*000000003~`;

describe('X12 Parser Integration Tests', () => {
  let parser: X12MessageParser;

  beforeEach(() => {
    parser = new X12MessageParser(
      new X12DelimiterDetector(),
      new X12SegmentParser(),
      new X12EnvelopeParser()
    );
  });

  describe('Cross-Version Testing (004010 vs 005010)', () => {
    it('should parse 850 version 004010', () => {
      const message = parser.parse(X12_850_004010);

      expect(message.standard).toBe(Standard.X12);
      expect(message.version.value).toBe('004010');
    });

    it('should parse 850 version 005010', () => {
      const message = parser.parse(X12_850_005010);

      expect(message.standard).toBe(Standard.X12);
      expect(message.version.value).toBe('005010');
    });

    it('should parse same message type from both versions independently', () => {
      const msg004010 = parser.parse(X12_850_004010);
      const msg005010 = parser.parse(X12_850_005010);

      expect(msg004010.messageType.value).toBe('850');
      expect(msg005010.messageType.value).toBe('850');
      expect(msg004010.version.value).not.toBe(msg005010.version.value);
    });
  });

  describe('Real-World Message Types', () => {
    it('should parse 837 Healthcare Claim (005010)', () => {
      const message = parser.parse(X12_837_005010);

      expect(message.standard).toBe(Standard.X12);
      expect(message.messageType.value).toBe('837');
    });

    it('should parse 856 Advanced Ship Notice (005010)', () => {
      const message = parser.parse(X12_856_005010);

      expect(message.standard).toBe(Standard.X12);
      expect(message.messageType.value).toBe('856');
      expect(message.segments.some(s => s.tag === 'BSN')).toBe(true);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should parse 850 (small ~1KB) in < 100ms', () => {
      const start = performance.now();
      parser.parse(X12_850_005010);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should parse 850 with 100 line items (~10KB) in < 100ms', () => {
      const largeMessage = buildMultiLinePO(100);

      const start = performance.now();
      parser.parse(largeMessage);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should parse 856 with 50 HL segments in < 200ms', () => {
      const largeShipment = buildMultiLinePO(50);

      const start = performance.now();
      parser.parse(largeShipment);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200);
    });

    it('should parse 1000 segments in < 500ms', () => {
      const hugeMessage = buildMultiLinePO(990);

      const start = performance.now();
      parser.parse(hugeMessage);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500);
    });
  });

  describe('Error Cases', () => {
    it('should throw on empty message', () => {
      expect(() => parser.parse('')).toThrow('EDI message cannot be empty');
    });

    it('should reject non-ISA message', () => {
      expect(() => parser.parse('GS*PO*SENDER~IEA*0*1~')).toThrow();
    });

    it('should throw when no functional groups', () => {
      const noGS = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~IEA*1*000000001~`;
      expect(() => parser.parse(noGS)).toThrow();
    });
  });

  describe('Validation Integration', () => {
    it('parsed message segments contain transaction-level data (ST..SE)', () => {
      const message = parser.parse(X12_850_005010);

      expect(message.standard).toBe(Standard.X12);
      expect(message.segments.some(s => s.tag === 'ST')).toBe(true);
      expect(message.segments.some(s => s.tag === 'SE')).toBe(true);
      expect(message.segments.some(s => s.tag === 'BEG')).toBe(true);
    });

    it('should validate X12 message with envelope segments', () => {
      const { EDIMessage, Standard: Std, Version, MessageType, EDISegment, EDIElement } = require('@ediflow/core');
      const message = new EDIMessage('test', Std.X12, new Version(Std.X12, '005010'), new MessageType(Std.X12, '850'));
      message.addSegment(new EDISegment('ISA', [
        new EDIElement('00'), new EDIElement('          '),
        new EDIElement('00'), new EDIElement('          '),
        new EDIElement('ZZ'), new EDIElement('SENDER         '),
        new EDIElement('ZZ'), new EDIElement('RECEIVER       '),
        new EDIElement('260204'), new EDIElement('1030'),
        new EDIElement('^'), new EDIElement('00501'),
        new EDIElement('000000001'),
        new EDIElement('0'), new EDIElement('P'), new EDIElement('>')
      ]));
      message.addSegment(new EDISegment('ST', []));
      message.addSegment(new EDISegment('BEG', []));
      message.addSegment(new EDISegment('SE', []));
      message.addSegment(new EDISegment('IEA', [new EDIElement('1'), new EDIElement('000000001')]));

      const validator = X12ValidationServiceBuilder.forX12();
      const result = validator.validate(message);

      expect(result.isValid).toBe(true);
    });

    it('should detect control number mismatch', () => {
      const { EDIMessage, Standard: Std, Version, MessageType, EDISegment, EDIElement } = require('@ediflow/core');
      const message = new EDIMessage('test', Std.X12, new Version(Std.X12, '005010'), new MessageType(Std.X12, '850'));
      message.addSegment(new EDISegment('ISA', [
        ...Array(12).fill(new EDIElement('')),
        new EDIElement('000000001')
      ]));
      message.addSegment(new EDISegment('IEA', [new EDIElement('1'), new EDIElement('999999999')]));

      const validator = X12ValidationServiceBuilder.forX12();
      const result = validator.validate(message);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'ENVELOPE_CONTROL_NUMBER_MISMATCH')).toBe(true);
    });
  });
});

function buildMultiLinePO(lineItemCount: number): string {
  let msg = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260204*1030*^*00501*000000001*0*P*>~GS*PO*SENDER*RECEIVER*20260204*1030*1*X*005010~ST*850*0001~BEG*00*SA*POLARGE**20260204~`;
  for (let i = 1; i <= lineItemCount; i++) {
    msg += `PO1*${i}*100*EA*10.50*PE*BP*PROD${String(i).padStart(4, '0')}~`;
  }
  msg += `SE*${lineItemCount + 3}*0001~GE*1*1~IEA*1*000000001~`;
  return msg;
}









