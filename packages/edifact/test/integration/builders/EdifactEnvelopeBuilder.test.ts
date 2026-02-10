import { describe, it, expect } from 'vitest';
import { EdifactEnvelopeBuilder } from '@edifact';
import { EDIMessage, EDISegment, EDIElement, Standard, Version, MessageType } from '@ediflow/core';

describe('EdifactEnvelopeBuilder', () => {
  describe('getSupportedStandard', () => {
    it('should return EDIFACT standard', () => {
      const builder = new EdifactEnvelopeBuilder();

      expect(builder.getSupportedStandard()).toBe(Standard.EDIFACT);
    });
  });

  describe('wrapMessage - UNH/UNT Envelope', () => {
    it('should add UNH and UNT segments around business message', () => {
      const builder = new EdifactEnvelopeBuilder();
      const businessMessage = new EDIMessage('test-id', 
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      businessMessage.addSegment(new EDISegment('BGM', [
        new EDIElement('380'),
        new EDIElement('INV001')
      ]));
      businessMessage.addSegment(new EDISegment('DTM', [
        new EDIElement('137:20250207:102', ['137', '20250207', '102'])
      ]));

      const result = builder.wrapMessage(businessMessage, {
        messageRef: '1',
        messageType: MessageType.from('INVOIC'),
        version: Version.from('D.96A')
      });

      expect(result.segments).toHaveLength(4);
      expect(result.segments[0]?.tag).toBe('UNH');
      expect(result.segments[1]?.tag).toBe('BGM');
      expect(result.segments[2]?.tag).toBe('DTM');
      expect(result.segments[3]?.tag).toBe('UNT');
    });

    it('should create correct UNH segment with message reference', () => {
      const builder = new EdifactEnvelopeBuilder();
      const businessMessage = new EDIMessage('test-id', 
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      businessMessage.addSegment(new EDISegment('BGM', [new EDIElement('380')]));

      const result = builder.wrapMessage(businessMessage, {
        messageRef: '12345',
        messageType: MessageType.from('INVOIC'),
        version: Version.from('D.96A')
      });

      const unh = result.segments[0];
      expect(unh?.elements[0]?.value).toBe('12345');
      expect(unh?.elements[1]?.value).toContain('INVOIC');
      expect(unh?.elements[1]?.value).toContain('D');
      expect(unh?.elements[1]?.value).toContain('96A');
    });

    it('should create correct UNT segment with segment count', () => {
      const builder = new EdifactEnvelopeBuilder();
      const businessMessage = new EDIMessage('test-id', 
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      businessMessage.addSegment(new EDISegment('BGM', [new EDIElement('380')]));
      businessMessage.addSegment(new EDISegment('DTM', [new EDIElement('137')]));

      const result = builder.wrapMessage(businessMessage, {
        messageRef: '1',
        messageType: MessageType.from('INVOIC'),
        version: Version.from('D.96A')
      });

      const unt = result.segments[result.segments.length - 1];
      expect(unt?.tag).toBe('UNT');
      expect(unt?.elements[0]?.value).toBe('4');
      expect(unt?.elements[1]?.value).toBe('1');
    });

    it('should handle empty business message', () => {
      const builder = new EdifactEnvelopeBuilder();
      const businessMessage = new EDIMessage('test-id', 
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      const result = builder.wrapMessage(businessMessage, {
        messageRef: '1',
        messageType: MessageType.from('INVOIC'),
        version: Version.from('D.96A')
      });

      expect(result.segments).toHaveLength(2);
      expect(result.segments[0]?.tag).toBe('UNH');
      expect(result.segments[1]?.tag).toBe('UNT');
    });
  });

  describe('wrapInterchange - UNB/UNZ Envelope', () => {
    it('should add UNB and UNZ segments around messages', () => {
      const builder = new EdifactEnvelopeBuilder();

      const message1 = new EDIMessage('test-id', 
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );
      message1.addSegment(new EDISegment('UNH', [new EDIElement('1')]));
      message1.addSegment(new EDISegment('BGM', [new EDIElement('380')]));
      message1.addSegment(new EDISegment('UNT', [new EDIElement('3'), new EDIElement('1')]));

      const result = builder.wrapInterchange([message1], {
        controlRef: 'REF123',
        sender: 'SENDER',
        receiver: 'RECEIVER',
        dateTime: new Date('2025-02-07T12:34:56')
      });

      expect(result.segments[0]?.tag).toBe('UNB');
      expect(result.segments[result.segments.length - 1]?.tag).toBe('UNZ');
    });

    it('should create correct UNB segment', () => {
      const builder = new EdifactEnvelopeBuilder();

      const message1 = new EDIMessage('test-id', 
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );
      message1.addSegment(new EDISegment('UNH', [new EDIElement('1')]));
      message1.addSegment(new EDISegment('UNT', [new EDIElement('2'), new EDIElement('1')]));

      const result = builder.wrapInterchange([message1], {
        controlRef: 'REF123',
        sender: 'SENDER123',
        receiver: 'RECEIVER456',
        dateTime: new Date('2025-02-07T12:34:56')
      });

      const unb = result.segments[0];
      expect(unb?.tag).toBe('UNB');
      expect(unb?.elements[0]?.value).toContain('UNOC');
      expect(unb?.elements[1]?.value).toBe('SENDER123');
      expect(unb?.elements[2]?.value).toBe('RECEIVER456');
      expect(unb?.elements[3]?.value).toContain('250207');
      expect(unb?.elements[3]?.value).toContain('1234');
      expect(unb?.elements[4]?.value).toBe('REF123');
    });

    it('should create correct UNZ segment with message count', () => {
      const builder = new EdifactEnvelopeBuilder();

      const message1 = new EDIMessage('test-id', 
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );
      message1.addSegment(new EDISegment('UNH', [new EDIElement('1')]));
      message1.addSegment(new EDISegment('UNT', [new EDIElement('2'), new EDIElement('1')]));

      const message2 = new EDIMessage('test-id', 
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('ORDERS')
      );
      message2.addSegment(new EDISegment('UNH', [new EDIElement('2')]));
      message2.addSegment(new EDISegment('UNT', [new EDIElement('2'), new EDIElement('2')]));

      const result = builder.wrapInterchange([message1, message2], {
        controlRef: 'REF123',
        sender: 'SENDER',
        receiver: 'RECEIVER',
        dateTime: new Date('2025-02-07T12:34:56')
      });

      const unz = result.segments[result.segments.length - 1];
      expect(unz?.tag).toBe('UNZ');
      expect(unz?.elements[0]?.value).toBe('2');
      expect(unz?.elements[1]?.value).toBe('REF123');
    });

    it('should handle multiple messages in interchange', () => {
      const builder = new EdifactEnvelopeBuilder();

      const messages = [1, 2, 3]?.map(i => {
        const msg = new EDIMessage('test-id', 
          Standard.EDIFACT,
          Version.from('D.96A'),
          MessageType.from('INVOIC')
        );
        msg.addSegment(new EDISegment('UNH', [new EDIElement(`${i}`)]));
        msg.addSegment(new EDISegment('BGM', [new EDIElement('380')]));
        msg.addSegment(new EDISegment('UNT', [new EDIElement('3'), new EDIElement(`${i}`)]));
        return msg;
      });

      const result = builder.wrapInterchange(messages, {
        controlRef: 'REF123',
        sender: 'SENDER',
        receiver: 'RECEIVER',
        dateTime: new Date('2025-02-07T12:34:56')
      });

      expect(result.segments[0]?.tag).toBe('UNB');

      let unhCount = 0;
      result.segments.forEach(seg => {
        if (seg.tag === 'UNH') unhCount++;
      });
      expect(unhCount).toBe(3);

      const unz = result.segments[result.segments.length - 1];
      expect(unz?.elements[0]?.value).toBe('3');
    });

    it('should format datetime correctly in UNB', () => {
      const builder = new EdifactEnvelopeBuilder();

      const message = new EDIMessage('test-id', 
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );
      message.addSegment(new EDISegment('UNH', [new EDIElement('1')]));
      message.addSegment(new EDISegment('UNT', [new EDIElement('2'), new EDIElement('1')]));

      const result = builder.wrapInterchange([message], {
        controlRef: 'REF123',
        sender: 'SENDER',
        receiver: 'RECEIVER',
        dateTime: new Date('2025-12-31T23:59:00')
      });

      const unb = result.segments[0];
      const dateTimeElement = unb?.elements[3];
      expect(dateTimeElement?.value).toBe('251231:2359');
    });
  });

  describe('Edge Cases', () => {
    it('should handle message with special characters in reference', () => {
      const builder = new EdifactEnvelopeBuilder();
      const businessMessage = new EDIMessage('test-id', 
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      businessMessage.addSegment(new EDISegment('BGM', [new EDIElement('380')]));

      const result = builder.wrapMessage(businessMessage, {
        messageRef: 'MSG-2025-001',
        messageType: MessageType.from('INVOIC'),
        version: Version.from('D.96A')
      });

      const unh = result.segments[0];
      expect(unh?.elements[0]?.value).toBe('MSG-2025-001');
    });

    it('should preserve original message metadata', () => {
      const builder = new EdifactEnvelopeBuilder();
      const businessMessage = new EDIMessage('test-id', 
        Standard.EDIFACT,
        Version.from('D.96A'),
        MessageType.from('INVOIC')
      );

      businessMessage.addSegment(new EDISegment('BGM', [new EDIElement('380')]));

      const result = builder.wrapMessage(businessMessage, {
        messageRef: '1',
        messageType: MessageType.from('INVOIC'),
        version: Version.from('D.96A')
      });

      expect(result.standard).toBe(Standard.EDIFACT);
      expect(result.version.value).toBe('D.96A');
      expect(result.messageType.value).toBe('INVOIC');
    });
  });
});
