import { describe, it, expect, beforeEach } from 'vitest';
import { EdifactMessageParser } from './EdifactMessageParser';
import { EdifactDelimiterDetector } from './EdifactDelimiterDetector';
import { EdifactTokenizer } from './EdifactTokenizer';
import { EdifactSegmentParser } from './EdifactSegmentParser';
import { Standard, Version, MessageType } from '@domain';

describe('EdifactMessageParser', () => {
  let parser: EdifactMessageParser;
  let delimiterDetector: EdifactDelimiterDetector;
  let tokenizer: EdifactTokenizer;
  let segmentParser: EdifactSegmentParser;

  beforeEach(() => {
    delimiterDetector = new EdifactDelimiterDetector();
    tokenizer = new EdifactTokenizer();
    segmentParser = new EdifactSegmentParser();
    parser = new EdifactMessageParser(delimiterDetector, tokenizer, segmentParser);
  });

  describe('parse', () => {
    it('should parse a complete EDIFACT message', () => {
      const edifact = "UNB+UNOC:3+SENDER+RECEIVER+210122:1200+1'UNH+1+ORDERS:D:96A:UN'BGM+220+ORDER123+9'UNT+3+1'UNZ+1+1'";

      const result = parser.parse(edifact);

      expect(result.standard).toBe(Standard.EDIFACT);
      expect(result.segments).toHaveLength(5);
    });

    it('should extract message type from UNH segment', () => {
      const edifact = "UNH+1+ORDERS:D:96A:UN'UNT+2+1'";

      const result = parser.parse(edifact);

      expect(result.messageType.value).toBe('ORDERS');
    });

    it('should extract version from UNH segment', () => {
      const edifact = "UNH+1+ORDERS:D:96A:UN'UNT+2+1'";

      const result = parser.parse(edifact);

      expect(result.version.value).toBe('D.96A');
    });

    it('should handle UNA header with custom delimiters', () => {
      const edifact = "UNA:+.? 'UNH+1+ORDERS:D:96A:UN'UNT+2+1'";

      const result = parser.parse(edifact);

      expect(result.messageType.value).toBe('ORDERS');
      expect(result.segments.length).toBeGreaterThanOrEqual(2);
    });

    it('should use custom delimiters from UNA for parsing', () => {
      const edifact = "UNA:+.? 'UNH+1+ORDERS:D:96A:UN'BGM+220+ORDER123'UNT+3+1'";

      const result = parser.parse(edifact);

      expect(result.messageType.value).toBe('ORDERS');
      const bgmSegment = result.segments.find(s => s.tag === 'BGM');
      expect(bgmSegment).toBeDefined();
      expect(bgmSegment?.elements).toHaveLength(2);
      expect(bgmSegment?.elements[0]?.value).toBe('220');
      expect(bgmSegment?.elements[1]?.value).toBe('ORDER123');
    });

    it('should handle alternative delimiters similar to X12 style', () => {
      const edifact = "UNA*~.? 'UNH~1~ORDERS*D*96A*UN'BGM~220~ORDER123'UNT~3~1'";

      const result = parser.parse(edifact);

      expect(result.messageType.value).toBe('ORDERS');
      expect(result.version.value).toBe('D.96A');
      const unhSegment = result.segments.find(s => s.tag === 'UNH');
      expect(unhSegment).toBeDefined();
      expect(unhSegment?.elements[1]?.value).toBe('ORDERS*D*96A*UN');

      const bgmSegment = result.segments.find(s => s.tag === 'BGM');
      expect(bgmSegment).toBeDefined();
      expect(bgmSegment?.elements).toHaveLength(2);
      expect(bgmSegment?.elements[0]?.value).toBe('220');
      expect(bgmSegment?.elements[1]?.value).toBe('ORDER123');
    });

    it('should handle pipe delimiter like some EDI variants', () => {
      const edifact = "UNA:| ? 'UNH|1|ORDERS:D:96A:UN'BGM|220|ORDER123'UNT|3|1'";

      const result = parser.parse(edifact);

      expect(result.messageType.value).toBe('ORDERS');
      const bgmSegment = result.segments.find(s => s.tag === 'BGM');
      expect(bgmSegment).toBeDefined();
      expect(bgmSegment?.elements[0]?.value).toBe('220');
      expect(bgmSegment?.elements[1]?.value).toBe('ORDER123');
    });

    it('should parse all segments in order', () => {
      const edifact = "UNH+1+ORDERS:D:96A:UN'BGM+220+ORDER123'DTM+137:20210122:102'UNT+4+1'";

      const result = parser.parse(edifact);

      expect(result.segments).toHaveLength(4);
      expect(result.segments[0]?.tag).toBe('UNH');
      expect(result.segments[1]?.tag).toBe('BGM');
      expect(result.segments[2]?.tag).toBe('DTM');
      expect(result.segments[3]?.tag).toBe('UNT');
    });

    it('should handle message with UNB and UNZ envelope', () => {
      const edifact = "UNB+UNOC:3+SENDER+RECEIVER+210122:1200+1'UNH+1+INVOIC:D:01B:UN'BGM+380+INV123'UNT+3+1'UNZ+1+1'";

      const result = parser.parse(edifact);

      expect(result.messageType.value).toBe('INVOIC');
      expect(result.version.value).toBe('D.01B');
      expect(result.segments).toHaveLength(5);
    });

    it('should throw error for message without UNH segment', () => {
      const edifact = "BGM+220+ORDER123'DTM+137:20210122:102'";

      expect(() => {
        parser.parse(edifact);
      }).toThrow('UNH segment not found');
    });

    it('should throw error for empty message', () => {
      expect(() => {
        parser.parse('');
      }).toThrow('EDI message cannot be empty');
    });

    it('should handle different EDIFACT versions', () => {
      const testCases = [
        { edifact: "UNH+1+DESADV:D:96A:UN'UNT+2+1'", version: 'D.96A', type: 'DESADV' },
        { edifact: "UNH+1+INVOIC:D:01B:UN'UNT+2+1'", version: 'D.01B', type: 'INVOIC' },
        { edifact: "UNH+1+ORDERS:D:20B:UN'UNT+2+1'", version: 'D.20B', type: 'ORDERS' },
      ];

      testCases.forEach(({ edifact, version, type }) => {
        const result = parser.parse(edifact);
        expect(result.version.value).toBe(version);
        expect(result.messageType.value).toBe(type);
      });
    });

    it('should parse UNH segment with all components', () => {
      const edifact = "UNH+1+ORDERS:D:96A:UN:EAN008'UNT+2+1'";

      const result = parser.parse(edifact);

      expect(result.messageType.value).toBe('ORDERS');
      expect(result.version.value).toBe('D.96A');
    });

    it('should handle complex message with multiple segment types', () => {
      const edifact = `UNH+1+ORDERS:D:96A:UN'BGM+220+ORDER123+9'DTM+137:20210122:102'NAD+BY+123456::9'LIN+1++PRODUCT123:EN'QTY+21:100'UNT+7+1'`;

      const result = parser.parse(edifact);

      expect(result.segments).toHaveLength(7);
      expect(result.messageType.value).toBe('ORDERS');
      const segmentTags = result.segments.map(s => s.tag);
      expect(segmentTags).toEqual(['UNH', 'BGM', 'DTM', 'NAD', 'LIN', 'QTY', 'UNT']);
    });
  });

  describe('extractMessageMetadata', () => {
    it('should extract version and message type from UNH', () => {
      const edifact = "UNH+1+DESADV:D:20B:UN'UNT+2+1'";

      const result = parser.parse(edifact);

      expect(result.version).toBeInstanceOf(Version);
      expect(result.messageType).toBeInstanceOf(MessageType);
      expect(result.version.value).toBe('D.20B');
      expect(result.messageType.value).toBe('DESADV');
    });
  });
});
