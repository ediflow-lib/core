import { describe, it, expect, beforeEach } from 'vitest';
import { X12MessageBuilder } from './X12MessageBuilder';
import { EDIMessage, EDISegment, EDIElement, Standard, Version, MessageType, Delimiters } from '@ediflow/core';
import { OutputFormat } from '@ediflow/core';

describe('X12MessageBuilder', () => {
  let builder: X12MessageBuilder;

  const createMessage = (segments: EDISegment[]): EDIMessage => {
    const message = new EDIMessage(
      'test-id',
      Standard.X12,
      new Version(Standard.X12, '004010'),
      new MessageType(Standard.X12, '850')
    );
    segments.forEach(s => message.addSegment(s));
    return message;
  };

  beforeEach(() => {
    builder = new X12MessageBuilder();
  });

  it('should return X12 as supported standard', () => {
    expect(builder.getSupportedStandard()).toBe(Standard.X12);
  });

  it('should build a simple segment with default delimiters', () => {
    const message = createMessage([
      new EDISegment('ST', [new EDIElement('850'), new EDIElement('0001')])
    ]);

    const result = builder.build(message);

    expect(result).toBe('ST*850*0001~');
  });

  it('should build multiple segments compact', () => {
    const message = createMessage([
      new EDISegment('ST', [new EDIElement('850'), new EDIElement('0001')]),
      new EDISegment('BEG', [new EDIElement('00'), new EDIElement('SA'), new EDIElement('PO-001')]),
      new EDISegment('SE', [new EDIElement('3'), new EDIElement('0001')])
    ]);

    const result = builder.build(message);

    expect(result).toBe('ST*850*0001~BEG*00*SA*PO-001~SE*3*0001~');
  });

  it('should build segments in readable format with line breaks', () => {
    const message = createMessage([
      new EDISegment('ST', [new EDIElement('850'), new EDIElement('0001')]),
      new EDISegment('SE', [new EDIElement('2'), new EDIElement('0001')])
    ]);

    const result = builder.build(message, { format: OutputFormat.READABLE });

    expect(result).toBe('ST*850*0001~\nSE*2*0001~\n');
  });

  it('should build composite element with component separator', () => {
    const composite = new EDIElement('11>B>1', ['11', 'B', '1']);
    const message = createMessage([
      new EDISegment('CLM', [new EDIElement('CLAIM001'), new EDIElement('1500'), composite])
    ]);

    const result = builder.build(message);

    expect(result).toBe('CLM*CLAIM001*1500*11>B>1~');
  });

  it('should use custom delimiters when provided', () => {
    const message = createMessage([
      new EDISegment('ST', [new EDIElement('850'), new EDIElement('0001')])
    ]);

    const result = builder.build(message, {
      delimiters: Delimiters.custom({ segment: '|', element: '+', component: ':', decimal: '.', escape: '' }),
    });

    expect(result).toBe('ST+850+0001|');
  });

  it('should build full 850 purchase order roundtrip', () => {
    const message = createMessage([
      new EDISegment('ST', [new EDIElement('850'), new EDIElement('0001')]),
      new EDISegment('BEG', [new EDIElement('00'), new EDIElement('SA'), new EDIElement('PO-001'), new EDIElement(''), new EDIElement('20260503')]),
      new EDISegment('SE', [new EDIElement('3'), new EDIElement('0001')])
    ]);

    const result = builder.build(message);

    expect(result).toContain('ST*850*0001~');
    expect(result).toContain('BEG*00*SA*PO-001**20260503~');
    expect(result).toContain('SE*3*0001~');
  });
});



