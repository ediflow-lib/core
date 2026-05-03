import {
  EDIMessage, EDISegment, EDIElement, Standard, Delimiters,
  IMessageBuilder, MessageBuilderOptions, OutputFormat
} from '@ediflow/core';

/**
 * X12 Message Builder
 *
 * Serializes an EDIMessage back to an X12 EDI string.
 * Default delimiters: element=*, component=>, segment=~
 */
export class X12MessageBuilder implements IMessageBuilder {
  private static readonly DEFAULT_DELIMITERS: Delimiters = Delimiters.custom({
    segment: '~',
    element: '*',
    component: '>',
    decimal: '.',
    escape: '',
  });

  build(message: EDIMessage, options?: MessageBuilderOptions): string {
    const delimiters = options?.delimiters ?? X12MessageBuilder.DEFAULT_DELIMITERS;
    const format = options?.format ?? OutputFormat.COMPACT;
    const segmentStrings = message.segments.map(seg => this.serializeSegment(seg, delimiters));

    return format === OutputFormat.READABLE
      ? segmentStrings.map(s => s + delimiters.segment + '\n').join('')
      : segmentStrings.join(delimiters.segment) + delimiters.segment;
  }

  getSupportedStandard(): Standard {
    return Standard.X12;
  }

  private serializeSegment(segment: EDISegment, delimiters: Delimiters): string {
    const parts = [
      segment.tag,
      ...segment.elements.map(el => this.serializeElement(el, delimiters)),
    ];
    return parts.join(delimiters.element);
  }

  private serializeElement(element: EDIElement, delimiters: Delimiters): string {
    return element.isComposite()
      ? element.components.join(delimiters.component)
      : element.value;
  }
}


