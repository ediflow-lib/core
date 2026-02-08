import {
  EDIMessage, EDISegment, EDIElement, Standard,
  IEnvelopeBuilder,
  MessageEnvelopeOptions,
  InterchangeEnvelopeOptions,
  EDIMessageFactory
}  from '@ediflow/core';

export class EdifactEnvelopeBuilder implements IEnvelopeBuilder {
  wrapMessage(message: EDIMessage, options: MessageEnvelopeOptions): EDIMessage {
    const segments = [...message.segments];
    const segmentCount = this.calculateSegmentCount(segments);

    const unh = this.createUNH(options);
    const unt = this.createUNT(segmentCount, options.messageRef);

    return this.buildWrappedMessage(message, unh, segments, unt);
  }

  wrapInterchange(messages: EDIMessage[], options: InterchangeEnvelopeOptions): EDIMessage {
    const unb = this.createUNB(options);
    const unz = this.createUNZ(messages.length, options.controlRef);

    return this.buildInterchange(messages, unb, unz);
  }

  getSupportedStandard(): Standard {
    return Standard.EDIFACT;
  }

  private calculateSegmentCount(segments: EDISegment[]): number {
    return segments.length + 2;
  }

  private createUNH(options: MessageEnvelopeOptions): EDISegment {
    const messageIdentifier = this.buildMessageIdentifier(options);

    return new EDISegment('UNH', [
      new EDIElement(options.messageRef),
      messageIdentifier
    ]);
  }

  private buildMessageIdentifier(options: MessageEnvelopeOptions): EDIElement {
    const versionWithoutPrefix = options.version.value.replace('D.', '');
    const components = [
      options.messageType.value,
      'D',
      versionWithoutPrefix,
      'UN'
    ];

    return new EDIElement(components.join(':'), components);
  }

  private createUNT(segmentCount: number, messageRef: string): EDISegment {
    return new EDISegment('UNT', [
      new EDIElement(segmentCount.toString()),
      new EDIElement(messageRef)
    ]);
  }

  private createUNB(options: InterchangeEnvelopeOptions): EDISegment {
    const dateTime = this.formatDateTime(options.dateTime);

    return new EDISegment('UNB', [
      new EDIElement('UNOC:3', ['UNOC', '3']),
      new EDIElement(options.sender),
      new EDIElement(options.receiver),
      new EDIElement(dateTime, dateTime.split(':')),
      new EDIElement(options.controlRef)
    ]);
  }

  private createUNZ(messageCount: number, controlRef: string): EDISegment {
    return new EDISegment('UNZ', [
      new EDIElement(messageCount.toString()),
      new EDIElement(controlRef)
    ]);
  }

  private buildWrappedMessage(
    original: EDIMessage,
    unh: EDISegment,
    businessSegments: EDISegment[],
    unt: EDISegment
  ): EDIMessage {
    const wrapped = EDIMessageFactory.create({
      standard: original.standard,
      version: original.version,
      messageType: original.messageType
    });

    wrapped.addSegment(unh);
    businessSegments.forEach(seg => wrapped.addSegment(seg));
    wrapped.addSegment(unt);

    return wrapped;
  }

  private buildInterchange(
    messages: EDIMessage[],
    unb: EDISegment,
    unz: EDISegment
  ): EDIMessage {
    if (messages.length === 0) {
      throw new Error('Cannot wrap interchange: messages array is empty');
    }

    const firstMessage = messages[0]!;
    const interchange = EDIMessageFactory.create({
      standard: firstMessage.standard,
      version: firstMessage.version,
      messageType: firstMessage.messageType
    });

    interchange.addSegment(unb);
    this.addAllMessageSegments(interchange, messages);
    interchange.addSegment(unz);

    return interchange;
  }

  private addAllMessageSegments(interchange: EDIMessage, messages: EDIMessage[]): void {
    const allSegments = this.flattenMessageSegments(messages);
    allSegments.forEach(seg => interchange.addSegment(seg));
  }

  private flattenMessageSegments(messages: EDIMessage[]): EDISegment[] {
    return messages.flatMap(msg => msg.segments);
  }

  private formatDateTime(date: Date): string {
    const yy = this.formatYear(date);
    const mm = this.formatMonth(date);
    const dd = this.formatDay(date);
    const hh = this.formatHours(date);
    const min = this.formatMinutes(date);

    return `${yy}${mm}${dd}:${hh}${min}`;
  }

  private formatYear(date: Date): string {
    return date.getFullYear().toString().slice(-2);
  }

  private formatMonth(date: Date): string {
    return String(date.getMonth() + 1).padStart(2, '0');
  }

  private formatDay(date: Date): string {
    return String(date.getDate()).padStart(2, '0');
  }

  private formatHours(date: Date): string {
    return String(date.getHours()).padStart(2, '0');
  }

  private formatMinutes(date: Date): string {
    return String(date.getMinutes()).padStart(2, '0');
  }
}
