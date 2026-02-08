import { describe, it, expect } from 'vitest';
import { EdifactMessageBuilder } from '@edifact/infrastructure/builders/EdifactMessageBuilder';
import { EDIMessage, EDISegment, EDIElement, Standard, Delimiters, Version, MessageType } from '@ediflow/core';
import { OutputFormat } from '@ediflow/core';

describe('EdifactMessageBuilder', () => {
  describe('getSupportedStandard', () => {
    it('should return EDIFACT standard', () => {
      const builder = new EdifactMessageBuilder();

      expect(builder.getSupportedStandard()).toBe(Standard.EDIFACT);
    });
  });

  describe('build - Simple Message', () => {
    it('should build EDI string with default delimiters', () => {
      const builder = new EdifactMessageBuilder();
      const message = new EDIMessage(
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      message.addSegment(new EDISegment('BGM', [
        new EDIElement('380'),
        new EDIElement('INV001'),
        new EDIElement('9')
      ]));

      const result = builder.build(message);

      expect(result).toBe("BGM+380+INV001+9'");
    });

    it('should build EDI string with multiple segments', () => {
      const builder = new EdifactMessageBuilder();
      const message = new EDIMessage(
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      message.addSegment(new EDISegment('BGM', [
        new EDIElement('380'),
        new EDIElement('INV001')
      ]));

      message.addSegment(new EDISegment('DTM', [
        new EDIElement('137:20250207:102', ['137', '20250207', '102'])
      ]));

      const result = builder.build(message);

      expect(result).toBe("BGM+380+INV001'DTM+137:20250207:102'");
    });

    it('should handle composite elements with component delimiter', () => {
      const builder = new EdifactMessageBuilder();
      const message = new EDIMessage(
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      message.addSegment(new EDISegment('NAD', [
        new EDIElement('BY'),
        new EDIElement('5412345000013:9', ['5412345000013', '9'])
      ]));

      const result = builder.build(message);

      expect(result).toBe("NAD+BY+5412345000013:9'");
    });
  });

  describe('build - Custom Delimiters', () => {
    it('should use custom delimiters when provided', () => {
      const builder = new EdifactMessageBuilder();
      const message = new EDIMessage(
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      message.addSegment(new EDISegment('BGM', [
        new EDIElement('380'),
        new EDIElement('INV001')
      ]));

      const result = builder.build(message, {
        delimiters: Delimiters.custom({
          segment: '~',
          element: '*',
          component: ':',
          decimal: '.',
          escape: '\\'
        })
      });

      expect(result).toBe("BGM*380*INV001~");
    });
  });

  describe('build - OutputFormat', () => {
    it('should build compact format by default', () => {
      const builder = new EdifactMessageBuilder();
      const message = new EDIMessage(
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      message.addSegment(new EDISegment('BGM', [new EDIElement('380')]));
      message.addSegment(new EDISegment('DTM', [new EDIElement('137')]));

      const result = builder.build(message);

      expect(result).toBe("BGM+380'DTM+137'");
      expect(result).not.toContain('\n');
    });

    it('should build readable format with line breaks', () => {
      const builder = new EdifactMessageBuilder();
      const message = new EDIMessage(
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      message.addSegment(new EDISegment('BGM', [new EDIElement('380')]));
      message.addSegment(new EDISegment('DTM', [new EDIElement('137')]));

      const result = builder.build(message, {
        format: OutputFormat.READABLE
      });

      expect(result).toBe("BGM+380'\nDTM+137'\n");
      expect(result).toContain('\n');
    });

    it('should handle COMPACT format explicitly', () => {
      const builder = new EdifactMessageBuilder();
      const message = new EDIMessage(
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      message.addSegment(new EDISegment('BGM', [new EDIElement('380')]));

      const result = builder.build(message, {
        format: OutputFormat.COMPACT
      });

      expect(result).toBe("BGM+380'");
      expect(result).not.toContain('\n');
    });
  });

  describe('build - EDIFACT-specific: includeUNA', () => {
    it('should include UNA segment when requested', () => {
      const builder = new EdifactMessageBuilder();
      const message = new EDIMessage(
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      message.addSegment(new EDISegment('BGM', [new EDIElement('380')]));

      const result = builder.build(message, {
        includeUNA: true
      });

      expect(result).toMatch(/^UNA:\+\.\? '/);
      expect(result).toBe("UNA:+.? 'BGM+380'");
    });

    it('should not include UNA by default', () => {
      const builder = new EdifactMessageBuilder();
      const message = new EDIMessage(
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      message.addSegment(new EDISegment('BGM', [new EDIElement('380')]));

      const result = builder.build(message);

      expect(result).not.toContain('UNA');
    });

    it('should build UNA with custom delimiters', () => {
      const builder = new EdifactMessageBuilder();
      const message = new EDIMessage(
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      message.addSegment(new EDISegment('BGM', [new EDIElement('380')]));

      const result = builder.build(message, {
        includeUNA: true,
        delimiters: Delimiters.custom({
          segment: '~',
          element: '*',
          component: '^',
          decimal: '.',
          escape: '\\'
        })
      });

      expect(result).toBe("UNA^*.\\\ ~BGM*380~");
    });
  });

  describe('build - Empty Message', () => {
    it('should handle message with no segments', () => {
      const builder = new EdifactMessageBuilder();
      const message = new EDIMessage(
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      const result = builder.build(message);

      expect(result).toBe("'");
    });
  });

  describe('build - Complex Composites', () => {
    it('should handle nested composite elements', () => {
      const builder = new EdifactMessageBuilder();
      const message = new EDIMessage(
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      message.addSegment(new EDISegment('UNH', [
        new EDIElement('1'),
        new EDIElement('INVOIC:D:96A:UN', ['INVOIC', 'D', '96A', 'UN'])
      ]));

      const result = builder.build(message);

      expect(result).toBe("UNH+1+INVOIC:D:96A:UN'");
    });

    it('should handle empty composite components', () => {
      const builder = new EdifactMessageBuilder();
      const message = new EDIMessage(
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      message.addSegment(new EDISegment('TEST', [
        new EDIElement('A::C', ['A', '', 'C'])
      ]));

      const result = builder.build(message);

      expect(result).toBe("TEST+A::C'");
    });
  });

  describe('build - Edge Cases', () => {
    it('should handle segment with single element', () => {
      const builder = new EdifactMessageBuilder();
      const message = new EDIMessage(
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      message.addSegment(new EDISegment('UNT', [
        new EDIElement('5')
      ]));

      const result = builder.build(message);

      expect(result).toBe("UNT+5'");
    });

    it('should handle segment with empty elements', () => {
      const builder = new EdifactMessageBuilder();
      const message = new EDIMessage(
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      message.addSegment(new EDISegment('TEST', [
        new EDIElement('A'),
        new EDIElement(''),
        new EDIElement('C')
      ]));

      const result = builder.build(message);

      expect(result).toBe("TEST+A++C'");
    });
  });
});
